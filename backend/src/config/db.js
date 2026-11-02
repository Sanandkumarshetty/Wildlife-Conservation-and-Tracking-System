import mysql from 'mysql2/promise';
import { env } from './env.js';

export const pool = mysql.createPool({
  host: env.dbHost, port: env.dbPort, user: env.dbUser, password: env.dbPassword,
  database: env.dbName, waitForConnections: true, connectionLimit: 10,
  decimalNumbers: true, timezone: 'Z',
});

export const query = async (sql, values = []) => {
  const [rows] = await pool.execute(sql, values);
  return rows;
};

// Safe, read-only structural check. Never runs G8.sql or modifies the database.
export async function verifySchema() {
  const expected = ['UserAccount','UserRegion','Region','Habitat','Species','Animal','Sighting','SuspiciousReport','ReportEvidence','Investigation','InvestigationNote','Patrol','PatrolCheckpoint','Institution','InstitutionMember','ResearchStudy','StudySpecies','MovementPoint','KnowledgeArticle','KnowledgeSource','EnvironmentalData','ConservationProject','ProjectSpecies','ProjectUpdate','ResearchPublication','ConservationEvent','AuditLog'];
  const [tableRows,viewRows,routineRows,triggerRows,columnRows,versionRows,spatialRows] = await Promise.all([
    query('SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = \'BASE TABLE\'', [env.dbName]),
    query('SELECT TABLE_NAME FROM information_schema.VIEWS WHERE TABLE_SCHEMA = ?', [env.dbName]),
    query('SELECT ROUTINE_NAME,ROUTINE_TYPE FROM information_schema.ROUTINES WHERE ROUTINE_SCHEMA = ?', [env.dbName]),
    query('SELECT TRIGGER_NAME FROM information_schema.TRIGGERS WHERE TRIGGER_SCHEMA = ?', [env.dbName]),
    query('SELECT TABLE_NAME,COLUMN_NAME,DATA_TYPE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ?', [env.dbName]),
    query('SELECT VERSION() version'),
    query("SELECT ST_SRID(ST_GeomFromText('POINT(0 0)',4326,'axis-order=long-lat')) srid"),
  ]);
  const expectedColumns={UserAccount:['user_id','full_name','email','password_hash','role','is_active'],Region:['region_id','region_name','boundary'],UserRegion:['user_id','region_id','assigned_by'],Species:['species_id','scientific_name','common_name','conservation_status'],Sighting:['sighting_id','reported_by','species_id','region_id','sighting_time','location','status'],SuspiciousReport:['report_id','reported_by','region_id','location_name','activity_type','location','reported_at','status','priority'],Investigation:['investigation_id','report_id','ranger_id','status'],InvestigationNote:['note_id','investigation_id','ranger_id','note_text'],Patrol:['patrol_id','ranger_id','region_id','start_time','status'],PatrolCheckpoint:['checkpoint_id','patrol_id','checkpoint_time','location'],ResearchStudy:['study_id','created_by','region_id','visibility'],MovementPoint:['movement_id','study_id','species_id','region_id','location'],ConservationProject:['project_id','visibility','created_by'],ReportEvidence:['evidence_id','report_id','file_path'],AuditLog:['audit_id','action_type','created_at']};
  const expectedSpatial={Region:{boundary:'polygon'},Habitat:{boundary:'polygon'},Sighting:{location:'point'},SuspiciousReport:{location:'point'},PatrolCheckpoint:{location:'point'},MovementPoint:{location:'point'},EnvironmentalData:{location:'point'},ConservationEvent:{location:'point'}};
  const normalized = value => String(value).toLowerCase();
  const columnKey = (table, column) => `${normalized(table)}.${normalized(column)}`;
  const present = new Set(tableRows.map(row => normalized(row.TABLE_NAME)));
  const columnSet=new Set(columnRows.map(row=>columnKey(row.TABLE_NAME,row.COLUMN_NAME)));
  const columnTypes=new Map(columnRows.map(row=>[columnKey(row.TABLE_NAME,row.COLUMN_NAME),String(row.DATA_TYPE).toLowerCase()]));
  const routines=new Map(routineRows.map(row=>[`${normalized(row.ROUTINE_TYPE)}:${normalized(row.ROUTINE_NAME)}`,true]));
  const expectedViews=['VerifiedWildlifeSightings','PublicConservationProjects','AnimalMovementSummary'];
  const expectedProcedures=['GetSightingsBySpecies','GetAuthorizedReports'];
  const expectedFunctions=['CountVerifiedSightings','SpeciesConservationLevel'];
  const expectedTriggers=['trg_suspicious_report_audit','trg_sighting_audit','trg_report_status_audit','trg_movement_species_validation'];
  const names=rows=>new Set(rows.map(row=>normalized(row.TABLE_NAME||row.TRIGGER_NAME)));
  const viewSet=names(viewRows),triggerSet=names(triggerRows);
  return {database:env.dbName,mysqlVersion:versionRows[0]?.version,spatialSrid4326AxisOrder:spatialRows[0]?.srid===4326,expectedTables:expected.length,missingTables:expected.filter(name=>!present.has(normalized(name))),missingColumns:Object.entries(expectedColumns).flatMap(([table,cols])=>cols.filter(col=>!columnSet.has(columnKey(table,col))).map(column=>`${table}.${column}`)),spatialTypeMismatches:Object.entries(expectedSpatial).flatMap(([table,cols])=>Object.entries(cols).filter(([col,type])=>columnTypes.get(columnKey(table,col))!==type).map(([column])=>`${table}.${column}`)),missingViews:expectedViews.filter(name=>!viewSet.has(normalized(name))),missingProcedures:expectedProcedures.filter(name=>!routines.has(`procedure:${normalized(name)}`)),missingFunctions:expectedFunctions.filter(name=>!routines.has(`function:${normalized(name)}`)),missingTriggers:expectedTriggers.filter(name=>!triggerSet.has(normalized(name)))};
}
