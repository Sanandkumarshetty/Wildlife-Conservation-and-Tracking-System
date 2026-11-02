DROP DATABASE IF EXISTS wildlife_conservation;
CREATE DATABASE wildlife_conservation CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE wildlife_conservation;

-- ============================================================
-- 2. CREATING TABLES (DDL)
-- ============================================================

CREATE TABLE Region (
    region_id INT AUTO_INCREMENT PRIMARY KEY,
    region_name VARCHAR(100) NOT NULL,
    state_name VARCHAR(100),
    country_name VARCHAR(100) NOT NULL DEFAULT 'India',
    description TEXT,
    boundary POLYGON SRID 4326 NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_region(region_name,state_name,country_name),
    SPATIAL INDEX idx_region_boundary(boundary)
) ENGINE=InnoDB;

CREATE TABLE UserAccount (
    user_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('CITIZEN','RANGER','RESEARCHER','ADMIN') NOT NULL DEFAULT 'CITIZEN',
    phone_number VARCHAR(30),
    organization_name VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_role(role), INDEX idx_user_active(is_active)
) ENGINE=InnoDB;

CREATE TABLE UserRegion (
    user_id BIGINT NOT NULL,
    region_id INT NOT NULL,
    assigned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    assigned_by BIGINT,
    PRIMARY KEY(user_id,region_id),
    CONSTRAINT fk_userregion_user FOREIGN KEY(user_id) REFERENCES UserAccount(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_userregion_region FOREIGN KEY(region_id) REFERENCES Region(region_id) ON DELETE CASCADE,
    CONSTRAINT fk_userregion_assigned_by FOREIGN KEY(assigned_by) REFERENCES UserAccount(user_id) ON DELETE SET NULL,
    INDEX idx_userregion_region(region_id)
) ENGINE=InnoDB;

CREATE TABLE Species (
    species_id INT AUTO_INCREMENT PRIMARY KEY,
    scientific_name VARCHAR(200) NOT NULL UNIQUE,
    common_name VARCHAR(150) NOT NULL,
    family_name VARCHAR(150),
    conservation_status VARCHAR(100),
    description TEXT,
    habitat_description TEXT,
    diet_description TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_species_common_name(common_name), INDEX idx_species_status(conservation_status)
) ENGINE=InnoDB;

CREATE TABLE Habitat (
    habitat_id INT AUTO_INCREMENT PRIMARY KEY,
    region_id INT NOT NULL,
    habitat_name VARCHAR(200) NOT NULL,
    habitat_type VARCHAR(150),
    description TEXT,
    boundary POLYGON SRID 4326 NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_habitat_region FOREIGN KEY(region_id) REFERENCES Region(region_id) ON DELETE RESTRICT,
    SPATIAL INDEX idx_habitat_boundary(boundary), INDEX idx_habitat_region(region_id)
) ENGINE=InnoDB;

CREATE TABLE Animal (
    animal_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    species_id INT NOT NULL,
    animal_identifier VARCHAR(100) NOT NULL UNIQUE,
    sex ENUM('MALE','FEMALE','UNKNOWN') NOT NULL DEFAULT 'UNKNOWN',
    estimated_birth_date DATE,
    current_region_id INT,
    description TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_animal_species FOREIGN KEY(species_id) REFERENCES Species(species_id) ON DELETE RESTRICT,
    CONSTRAINT fk_animal_region FOREIGN KEY(current_region_id) REFERENCES Region(region_id) ON DELETE SET NULL,
    INDEX idx_animal_species(species_id), INDEX idx_animal_region(current_region_id)
) ENGINE=InnoDB;

CREATE TABLE Sighting (
    sighting_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    reported_by BIGINT NOT NULL,
    species_id INT,
    animal_id BIGINT,
    region_id INT NOT NULL,
    habitat_id INT,
    sighting_time DATETIME NOT NULL,
    location POINT SRID 4326 NOT NULL,
    description TEXT,
    status ENUM('SUBMITTED','VERIFIED','REJECTED') NOT NULL DEFAULT 'SUBMITTED',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_sighting_user FOREIGN KEY(reported_by) REFERENCES UserAccount(user_id) ON DELETE RESTRICT,
    CONSTRAINT fk_sighting_species FOREIGN KEY(species_id) REFERENCES Species(species_id) ON DELETE SET NULL,
    CONSTRAINT fk_sighting_animal FOREIGN KEY(animal_id) REFERENCES Animal(animal_id) ON DELETE SET NULL,
    CONSTRAINT fk_sighting_region FOREIGN KEY(region_id) REFERENCES Region(region_id) ON DELETE RESTRICT,
    CONSTRAINT fk_sighting_habitat FOREIGN KEY(habitat_id) REFERENCES Habitat(habitat_id) ON DELETE SET NULL,
    SPATIAL INDEX idx_sighting_location(location), INDEX idx_sighting_region(region_id),
    INDEX idx_sighting_species(species_id), INDEX idx_sighting_time(sighting_time), INDEX idx_sighting_status(status)
) ENGINE=InnoDB;

CREATE TABLE SuspiciousReport (
    report_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    reported_by BIGINT NOT NULL,
    region_id INT NULL,
    location_name VARCHAR(255) NULL,
    activity_type ENUM('POSSIBLE_POACHING','SUSPICIOUS_VEHICLE','ILLEGAL_FOREST_ENTRY','WILDLIFE_TRAFFICKING','ANIMAL_IN_DANGER','OTHER') NOT NULL,
    location POINT SRID 4326 NOT NULL,
    reported_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    description TEXT,
    status ENUM('PENDING','UNDER_INVESTIGATION','RESOLVED','REJECTED') NOT NULL DEFAULT 'PENDING',
    priority ENUM('LOW','MEDIUM','HIGH','CRITICAL') NOT NULL DEFAULT 'MEDIUM',
    CONSTRAINT fk_report_user FOREIGN KEY(reported_by) REFERENCES UserAccount(user_id) ON DELETE RESTRICT,
    CONSTRAINT fk_report_region FOREIGN KEY(region_id) REFERENCES Region(region_id) ON DELETE RESTRICT,
    SPATIAL INDEX idx_report_location(location), INDEX idx_report_region(region_id), INDEX idx_report_status(status),
    INDEX idx_report_type(activity_type), INDEX idx_report_date(reported_at)
) ENGINE=InnoDB;

CREATE TABLE ReportEvidence (
    evidence_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    report_id BIGINT NOT NULL,
    uploaded_by BIGINT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(100),
    description TEXT,
    uploaded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_evidence_report FOREIGN KEY(report_id) REFERENCES SuspiciousReport(report_id) ON DELETE CASCADE,
    CONSTRAINT fk_evidence_user FOREIGN KEY(uploaded_by) REFERENCES UserAccount(user_id) ON DELETE RESTRICT,
    INDEX idx_evidence_report(report_id)
) ENGINE=InnoDB;

CREATE TABLE Investigation (
    investigation_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    report_id BIGINT NOT NULL,
    ranger_id BIGINT NOT NULL,
    started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    findings TEXT,
    resolution TEXT,
    status ENUM('OPEN','IN_PROGRESS','COMPLETED','CLOSED') NOT NULL DEFAULT 'OPEN',
    CONSTRAINT fk_investigation_report FOREIGN KEY(report_id) REFERENCES SuspiciousReport(report_id) ON DELETE CASCADE,
    CONSTRAINT fk_investigation_ranger FOREIGN KEY(ranger_id) REFERENCES UserAccount(user_id) ON DELETE RESTRICT,
    INDEX idx_investigation_report(report_id), INDEX idx_investigation_ranger(ranger_id), INDEX idx_investigation_status(status)
) ENGINE=InnoDB;

CREATE TABLE InvestigationNote (
    note_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    investigation_id BIGINT NOT NULL,
    ranger_id BIGINT NOT NULL,
    note_text TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_note_investigation FOREIGN KEY(investigation_id) REFERENCES Investigation(investigation_id) ON DELETE CASCADE,
    CONSTRAINT fk_note_ranger FOREIGN KEY(ranger_id) REFERENCES UserAccount(user_id) ON DELETE RESTRICT,
    INDEX idx_note_investigation(investigation_id)
) ENGINE=InnoDB;

CREATE TABLE Patrol (
    patrol_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    ranger_id BIGINT NOT NULL,
    region_id INT NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME,
    status ENUM('PLANNED','ONGOING','COMPLETED','CANCELLED') NOT NULL DEFAULT 'PLANNED',
    notes TEXT,
    CONSTRAINT fk_patrol_ranger FOREIGN KEY(ranger_id) REFERENCES UserAccount(user_id) ON DELETE RESTRICT,
    CONSTRAINT fk_patrol_region FOREIGN KEY(region_id) REFERENCES Region(region_id) ON DELETE RESTRICT,
    INDEX idx_patrol_ranger(ranger_id), INDEX idx_patrol_region(region_id), INDEX idx_patrol_status(status)
) ENGINE=InnoDB;

CREATE TABLE PatrolCheckpoint (
    checkpoint_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    patrol_id BIGINT NOT NULL,
    checkpoint_time DATETIME NOT NULL,
    location POINT SRID 4326 NOT NULL,
    notes TEXT,
    CONSTRAINT fk_checkpoint_patrol FOREIGN KEY(patrol_id) REFERENCES Patrol(patrol_id) ON DELETE CASCADE,
    SPATIAL INDEX idx_checkpoint_location(location), INDEX idx_checkpoint_patrol(patrol_id), INDEX idx_checkpoint_time(checkpoint_time)
) ENGINE=InnoDB;

CREATE TABLE Institution (
    institution_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    institution_name VARCHAR(255) NOT NULL,
    institution_type ENUM('UNIVERSITY','RESEARCH_INSTITUTE','NGO','GOVERNMENT','CONSERVATION_ORGANIZATION','OTHER') NOT NULL,
    region_id INT,
    description TEXT,
    website_url VARCHAR(1000),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(30),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_institution_region FOREIGN KEY(region_id) REFERENCES Region(region_id) ON DELETE SET NULL,
    INDEX idx_institution_region(region_id), INDEX idx_institution_type(institution_type)
) ENGINE=InnoDB;

CREATE TABLE InstitutionMember (
    institution_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    member_role VARCHAR(150),
    joined_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(institution_id,user_id),
    CONSTRAINT fk_member_institution FOREIGN KEY(institution_id) REFERENCES Institution(institution_id) ON DELETE CASCADE,
    CONSTRAINT fk_member_user FOREIGN KEY(user_id) REFERENCES UserAccount(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE ResearchStudy (
    study_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    institution_id BIGINT,
    created_by BIGINT NOT NULL,
    region_id INT NOT NULL,
    study_name VARCHAR(255) NOT NULL,
    description TEXT,
    start_date DATE,
    end_date DATE,
    external_source VARCHAR(200),
    external_study_id VARCHAR(200),
    status ENUM('PLANNED','ONGOING','COMPLETED','SUSPENDED','ARCHIVED') NOT NULL DEFAULT 'PLANNED',
    visibility ENUM('PUBLIC','PRIVATE') NOT NULL DEFAULT 'PUBLIC',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_study_institution FOREIGN KEY(institution_id) REFERENCES Institution(institution_id) ON DELETE SET NULL,
    CONSTRAINT fk_study_creator FOREIGN KEY(created_by) REFERENCES UserAccount(user_id) ON DELETE RESTRICT,
    CONSTRAINT fk_study_region FOREIGN KEY(region_id) REFERENCES Region(region_id) ON DELETE RESTRICT,
    INDEX idx_study_institution(institution_id), INDEX idx_study_creator(created_by), INDEX idx_study_region(region_id), INDEX idx_study_status(status)
) ENGINE=InnoDB;

CREATE TABLE StudySpecies (
    study_id BIGINT NOT NULL,
    species_id INT NOT NULL,
    PRIMARY KEY(study_id,species_id),
    CONSTRAINT fk_studyspecies_study FOREIGN KEY(study_id) REFERENCES ResearchStudy(study_id) ON DELETE CASCADE,
    CONSTRAINT fk_studyspecies_species FOREIGN KEY(species_id) REFERENCES Species(species_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE MovementPoint (
    movement_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    study_id BIGINT NOT NULL,
    animal_id BIGINT,
    species_id INT NOT NULL,
    region_id INT NOT NULL,
    observed_at DATETIME NOT NULL,
    location POINT SRID 4326 NOT NULL,
    ground_speed DECIMAL(10,3),
    heading DECIMAL(7,3),
    source_name VARCHAR(150),
    external_record_id VARCHAR(200),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_movement_study FOREIGN KEY(study_id) REFERENCES ResearchStudy(study_id) ON DELETE CASCADE,
    CONSTRAINT fk_movement_animal FOREIGN KEY(animal_id) REFERENCES Animal(animal_id) ON DELETE SET NULL,
    CONSTRAINT fk_movement_species FOREIGN KEY(species_id) REFERENCES Species(species_id) ON DELETE RESTRICT,
    CONSTRAINT fk_movement_region FOREIGN KEY(region_id) REFERENCES Region(region_id) ON DELETE RESTRICT,
    SPATIAL INDEX idx_movement_location(location), INDEX idx_movement_study(study_id), INDEX idx_movement_animal(animal_id),
    INDEX idx_movement_species(species_id), INDEX idx_movement_region(region_id), INDEX idx_movement_time(observed_at),
    UNIQUE KEY uq_external_movement(source_name,external_record_id)
) ENGINE=InnoDB;

CREATE TABLE KnowledgeArticle (
    article_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    created_by BIGINT NOT NULL,
    species_id INT,
    region_id INT,
    title VARCHAR(255) NOT NULL,
    content LONGTEXT NOT NULL,
    article_type ENUM('SPECIES','HABITAT','BEHAVIOR','CONSERVATION','SAFETY','RESEARCH','OTHER') NOT NULL,
    status ENUM('DRAFT','PUBLISHED','ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_article_creator FOREIGN KEY(created_by) REFERENCES UserAccount(user_id) ON DELETE RESTRICT,
    CONSTRAINT fk_article_species FOREIGN KEY(species_id) REFERENCES Species(species_id) ON DELETE SET NULL,
    CONSTRAINT fk_article_region FOREIGN KEY(region_id) REFERENCES Region(region_id) ON DELETE SET NULL,
    INDEX idx_article_species(species_id), INDEX idx_article_region(region_id), INDEX idx_article_status(status),
    FULLTEXT INDEX idx_article_search(title,content)
) ENGINE=InnoDB;

CREATE TABLE KnowledgeSource (
    source_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    article_id BIGINT NOT NULL,
    source_title VARCHAR(255) NOT NULL,
    source_url VARCHAR(1000),
    publisher VARCHAR(255),
    publication_date DATE,
    accessed_at DATETIME,
    CONSTRAINT fk_source_article FOREIGN KEY(article_id) REFERENCES KnowledgeArticle(article_id) ON DELETE CASCADE,
    INDEX idx_source_article(article_id)
) ENGINE=InnoDB;

CREATE TABLE EnvironmentalData (
    environmental_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    region_id INT NOT NULL,
    recorded_at DATETIME NOT NULL,
    location POINT SRID 4326 NOT NULL,
    temperature_celsius DECIMAL(6,2),
    humidity_percent DECIMAL(6,2),
    rainfall_mm DECIMAL(8,2),
    heatwave_flag BOOLEAN NOT NULL DEFAULT FALSE,
    source_name VARCHAR(150),
    external_record_id VARCHAR(200),
    CONSTRAINT fk_environment_region FOREIGN KEY(region_id) REFERENCES Region(region_id) ON DELETE RESTRICT,
    SPATIAL INDEX idx_environment_location(location), INDEX idx_environment_region(region_id), INDEX idx_environment_time(recorded_at),
    INDEX idx_environment_heatwave(heatwave_flag), UNIQUE KEY uq_environment_external(source_name,external_record_id)
) ENGINE=InnoDB;

CREATE TABLE ConservationProject (
    project_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    institution_id BIGINT,
    created_by BIGINT NOT NULL,
    region_id INT NOT NULL,
    project_name VARCHAR(255) NOT NULL,
    project_type ENUM('WILDLIFE_RESEARCH','BIODIVERSITY_SURVEY','HABITAT_RESTORATION','SPECIES_CONSERVATION','CITIZEN_SCIENCE','AWARENESS','OTHER') NOT NULL,
    description TEXT,
    start_date DATE,
    end_date DATE,
    status ENUM('PLANNED','ONGOING','COMPLETED','SUSPENDED','ARCHIVED') NOT NULL DEFAULT 'PLANNED',
    visibility ENUM('PUBLIC','PRIVATE') NOT NULL DEFAULT 'PUBLIC',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_project_institution FOREIGN KEY(institution_id) REFERENCES Institution(institution_id) ON DELETE SET NULL,
    CONSTRAINT fk_project_creator FOREIGN KEY(created_by) REFERENCES UserAccount(user_id) ON DELETE RESTRICT,
    CONSTRAINT fk_project_region FOREIGN KEY(region_id) REFERENCES Region(region_id) ON DELETE RESTRICT,
    INDEX idx_project_institution(institution_id), INDEX idx_project_region(region_id), INDEX idx_project_type(project_type), INDEX idx_project_status(status)
) ENGINE=InnoDB;

CREATE TABLE ProjectSpecies (
    project_id BIGINT NOT NULL,
    species_id INT NOT NULL,
    PRIMARY KEY(project_id,species_id),
    CONSTRAINT fk_projectspecies_project FOREIGN KEY(project_id) REFERENCES ConservationProject(project_id) ON DELETE CASCADE,
    CONSTRAINT fk_projectspecies_species FOREIGN KEY(species_id) REFERENCES Species(species_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE ProjectUpdate (
    update_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    project_id BIGINT NOT NULL,
    posted_by BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    published_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_update_project FOREIGN KEY(project_id) REFERENCES ConservationProject(project_id) ON DELETE CASCADE,
    CONSTRAINT fk_update_user FOREIGN KEY(posted_by) REFERENCES UserAccount(user_id) ON DELETE RESTRICT,
    INDEX idx_update_project(project_id), INDEX idx_update_date(published_at)
) ENGINE=InnoDB;

CREATE TABLE ResearchPublication (
    publication_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    project_id BIGINT,
    study_id BIGINT,
    title VARCHAR(500) NOT NULL,
    authors TEXT,
    journal_name VARCHAR(255),
    publication_year YEAR,
    doi VARCHAR(255),
    publication_url VARCHAR(1000),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_publication_project FOREIGN KEY(project_id) REFERENCES ConservationProject(project_id) ON DELETE SET NULL,
    CONSTRAINT fk_publication_study FOREIGN KEY(study_id) REFERENCES ResearchStudy(study_id) ON DELETE SET NULL,
    INDEX idx_publication_project(project_id), INDEX idx_publication_study(study_id), INDEX idx_publication_year(publication_year)
) ENGINE=InnoDB;

CREATE TABLE ConservationEvent (
    event_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    institution_id BIGINT,
    region_id INT NOT NULL,
    created_by BIGINT NOT NULL,
    event_name VARCHAR(255) NOT NULL,
    event_type ENUM('WILDLIFE_SURVEY','BIODIVERSITY_SURVEY','CITIZEN_SCIENCE','AWARENESS','TRAINING','WORKSHOP','OTHER') NOT NULL,
    description TEXT,
    start_datetime DATETIME NOT NULL,
    end_datetime DATETIME,
    location POINT SRID 4326 NOT NULL,
    registration_url VARCHAR(1000),
    status ENUM('UPCOMING','ONGOING','COMPLETED','CANCELLED') NOT NULL DEFAULT 'UPCOMING',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_event_institution FOREIGN KEY(institution_id) REFERENCES Institution(institution_id) ON DELETE SET NULL,
    CONSTRAINT fk_event_region FOREIGN KEY(region_id) REFERENCES Region(region_id) ON DELETE RESTRICT,
    CONSTRAINT fk_event_creator FOREIGN KEY(created_by) REFERENCES UserAccount(user_id) ON DELETE RESTRICT,
    SPATIAL INDEX idx_event_location(location), INDEX idx_event_region(region_id), INDEX idx_event_date(start_datetime), INDEX idx_event_status(status)
) ENGINE=InnoDB;

CREATE TABLE AuditLog (
    audit_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT,
    action_type VARCHAR(100) NOT NULL,
    table_name VARCHAR(100),
    record_id BIGINT,
    action_description TEXT,
    ip_address VARCHAR(45),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_user FOREIGN KEY(user_id) REFERENCES UserAccount(user_id) ON DELETE SET NULL,
    INDEX idx_audit_user(user_id), INDEX idx_audit_table(table_name), INDEX idx_audit_date(created_at)
) ENGINE=InnoDB;

-- ============================================================
-- 3. INSERTING VALUES (DML)
-- Coordinates use POINT(longitude latitude), EPSG:4326.
-- ============================================================

INSERT INTO Region(region_id,region_name,state_name,country_name,description,boundary) VALUES
(1,'Bandipur','Karnataka','India','Tiger reserve and wildlife habitat',ST_GeomFromText('POLYGON((76.45 11.55,76.75 11.55,76.75 11.85,76.45 11.85,76.45 11.55))',4326,'axis-order=long-lat')),
(2,'Nagarhole','Karnataka','India','Forest and wildlife conservation region',ST_GeomFromText('POLYGON((76.00 11.90,76.40 11.90,76.40 12.30,76.00 12.30,76.00 11.90))',4326,'axis-order=long-lat')),
(3,'Wayanad','Kerala','India','Western Ghats wildlife region',ST_GeomFromText('POLYGON((75.65 11.45,76.10 11.45,76.10 11.85,75.65 11.85,75.65 11.45))',4326,'axis-order=long-lat'));

INSERT INTO UserAccount(user_id,full_name,email,password_hash,role,phone_number,organization_name) VALUES
(1,'System Administrator','admin@wildlife.local','HASH_ADMIN','ADMIN','9000000001','Wildlife Conservation System'),
(2,'Ravi Kumar','ravi.ranger@wildlife.local','HASH_RAVI','RANGER','9000000002','Forest Department'),
(3,'Anita Rao','anita.ranger@wildlife.local','HASH_ANITA','RANGER','9000000003','Forest Department'),
(4,'Dr Meera Nair','meera.research@wildlife.local','HASH_MEERA','RESEARCHER','9000000004','Western Ghats Research Institute'),
(5,'Arjun Shetty','arjun.citizen@wildlife.local','HASH_ARJUN','CITIZEN','9000000005',NULL),
(6,'Kavya Menon','kavya.research@wildlife.local','HASH_KAVYA','RESEARCHER','9000000006','Wildlife Research Centre');

INSERT INTO UserRegion(user_id,region_id,assigned_by) VALUES
(2,1,1),(3,2,1),(4,1,1),(4,2,1),(4,3,1),(6,3,1);

INSERT INTO Species(species_id,scientific_name,common_name,family_name,conservation_status,description,habitat_description,diet_description) VALUES
(1,'Panthera tigris','Bengal Tiger','Felidae','Endangered','Large carnivorous wild cat found in forest ecosystems.','Forests and grasslands','Carnivorous'),
(2,'Elephas maximus','Asian Elephant','Elephantidae','Endangered','Large herbivorous mammal important to forest ecosystems.','Occurs in tropical and subtropical forests, including evergreen, semi-evergreen and deciduous forests, as well as grasslands, scrublands and forest-edge habitats with access to water.','Herbivorous'),
(3,'Panthera pardus','Indian Leopard','Felidae','Vulnerable','Adaptable wild cat found across several habitats.','Forests and rocky habitats','Carnivorous'),
(4,'Rusa unicolor','Sambar Deer','Cervidae','Vulnerable','Large deer species commonly found in Indian forests.','Found in tropical and subtropical forests, including deciduous forests, evergreen forests, woodland, forest edges and nearby grasslands.','Herbivorous');

INSERT INTO Habitat(habitat_id,region_id,habitat_name,habitat_type,description,boundary) VALUES
(1,1,'Bandipur Core Forest','Forest','Protected core forest area',ST_GeomFromText('POLYGON((76.50 11.60,76.70 11.60,76.70 11.80,76.50 11.80,76.50 11.60))',4326,'axis-order=long-lat')),
(2,2,'Nagarhole Forest','Forest','Forest habitat for large mammals',ST_GeomFromText('POLYGON((76.05 11.95,76.30 11.95,76.30 12.20,76.05 12.20,76.05 11.95))',4326,'axis-order=long-lat')),
(3,3,'Wayanad Grassland','Grassland','Grassland habitat',ST_GeomFromText('POLYGON((75.70 11.50,76.00 11.50,76.00 11.75,75.70 11.75,75.70 11.50))',4326,'axis-order=long-lat'));

INSERT INTO Animal(animal_id,species_id,animal_identifier,sex,estimated_birth_date,current_region_id,description) VALUES
(1,1,'TIGER-BP-001','MALE','2019-05-10',1,'Adult tiger recorded in Bandipur'),
(2,1,'TIGER-BP-002','FEMALE','2020-07-12',1,'Adult female tiger'),
(3,2,'ELE-NG-001','FEMALE','2012-03-15',2,'Adult elephant'),
(4,3,'LEO-WY-001','MALE','2021-01-20',3,'Young leopard'),
(5,4,'SAM-NG-001','MALE','2018-08-08',2,'Adult sambar deer');

INSERT INTO Sighting(sighting_id,reported_by,species_id,animal_id,region_id,habitat_id,sighting_time,location,description,status) VALUES
(1,5,1,1,1,1,'2026-09-25 07:30:00',ST_GeomFromText('POINT(76.5946 11.7000)',4326,'axis-order=long-lat'),'Tiger observed near forest trail','VERIFIED'),
(2,2,2,3,2,2,'2026-09-26 18:10:00',ST_GeomFromText('POINT(76.1800 12.0500)',4326,'axis-order=long-lat'),'Elephant herd observed','VERIFIED'),
(3,5,3,4,3,3,'2026-09-27 21:15:00',ST_GeomFromText('POINT(75.8200 11.6500)',4326,'axis-order=long-lat'),'Leopard sighting reported by citizen','SUBMITTED'),
(4,5,1,2,1,1,'2026-09-28 06:45:00',ST_GeomFromText('POINT(76.6200 11.7300)',4326,'axis-order=long-lat'),'Female tiger near water source','VERIFIED'),
(5,3,4,5,2,2,'2026-09-28 17:20:00',ST_GeomFromText('POINT(76.2200 12.0900)',4326,'axis-order=long-lat'),'Sambar deer herd','VERIFIED');

INSERT INTO SuspiciousReport(report_id,reported_by,region_id,activity_type,location,reported_at,description,status,priority) VALUES
(1,5,1,'POSSIBLE_POACHING',ST_GeomFromText('POINT(76.6000 11.7200)',4326,'axis-order=long-lat'),'Unknown vehicle entered restricted area','PENDING','HIGH'),
(2,5,2,'ILLEGAL_FOREST_ENTRY',ST_GeomFromText('POINT(76.2100 12.0700)',4326,'axis-order=long-lat'),'People seen entering closed forest trail','UNDER_INVESTIGATION','MEDIUM'),
(3,2,1,'ANIMAL_IN_DANGER',ST_GeomFromText('POINT(76.6500 11.7600)',4326,'axis-order=long-lat'),'Animal appears injured near road','RESOLVED','HIGH');

INSERT INTO ReportEvidence(report_id,uploaded_by,file_name,file_path,file_type,description) VALUES
(1,5,'vehicle.jpg','/uploads/reports/vehicle.jpg','image/jpeg','Photo of suspicious vehicle'),
(2,5,'trail.jpg','/uploads/reports/trail.jpg','image/jpeg','Photo of restricted trail');

INSERT INTO Investigation(investigation_id,report_id,ranger_id,findings,resolution,status) VALUES
(1,2,3,'Patrol confirmed unauthorized entry.','Warning issued and area secured.','COMPLETED'),
(2,3,2,'Animal was located and assessed by field team.','Rescue team notified.','CLOSED');

INSERT INTO InvestigationNote(investigation_id,ranger_id,note_text) VALUES
(1,3,'Checked checkpoint logs and confirmed entry time.'),
(2,2,'Follow-up patrol completed after rescue notification.');

INSERT INTO Patrol(patrol_id,ranger_id,region_id,start_time,end_time,status,notes) VALUES
(1,2,1,'2026-09-28 06:00:00','2026-09-28 11:00:00','COMPLETED','Morning wildlife monitoring patrol'),
(2,3,2,'2026-09-29 07:00:00',NULL,'ONGOING','Forest boundary patrol');

INSERT INTO PatrolCheckpoint(patrol_id,checkpoint_time,location,notes) VALUES
(1,'2026-09-28 07:15:00',ST_GeomFromText('POINT(76.5800 11.6800)',4326,'axis-order=long-lat'),'Checkpoint A'),
(1,'2026-09-28 09:00:00',ST_GeomFromText('POINT(76.6200 11.7300)',4326,'axis-order=long-lat'),'Water source checkpoint'),
(2,'2026-09-29 08:30:00',ST_GeomFromText('POINT(76.1900 12.0600)',4326,'axis-order=long-lat'),'Forest boundary checkpoint');

INSERT INTO Institution(institution_id,institution_name,institution_type,region_id,description,website_url,contact_email) VALUES
(1,'Western Ghats Research Institute','RESEARCH_INSTITUTE',3,'Wildlife and biodiversity research organization','https://example.org/wgri','research@example.org'),
(2,'Green Forest Conservation Foundation','NGO',1,'Conservation and community awareness organization','https://example.org/gfcf','contact@example.org');

INSERT INTO InstitutionMember(institution_id,user_id,member_role) VALUES
(1,4,'Lead Researcher'),(1,6,'Researcher'),(2,5,'Citizen Volunteer');

INSERT INTO ResearchStudy(study_id,institution_id,created_by,region_id,study_name,description,start_date,end_date,external_source,external_study_id,status,visibility) VALUES
(1,1,4,1,'Tiger Movement Study','Analysis of tiger movement in Bandipur','2026-08-01',NULL,'Movebank','MB-TIGER-001','ONGOING','PUBLIC'),
(2,1,4,2,'Elephant Movement Study','Analysis of elephant movement in Nagarhole','2026-08-15',NULL,'Movebank','MB-ELE-001','ONGOING','PUBLIC'),
(3,1,6,3,'Leopard Habitat Study','Study of leopard movement and habitat use','2026-09-01',NULL,'Research Upload','LOCAL-LEO-001','ONGOING','PRIVATE');

INSERT INTO StudySpecies(study_id,species_id) VALUES (1,1),(2,2),(3,3);

INSERT INTO MovementPoint(movement_id,study_id,animal_id,species_id,region_id,observed_at,location,ground_speed,heading,source_name,external_record_id) VALUES
(1,1,1,1,1,'2026-09-25 07:00:00',ST_GeomFromText('POINT(76.5700 11.6800)',4326,'axis-order=long-lat'),2.100,90.000,'Movebank','T001'),
(2,1,1,1,1,'2026-09-25 10:00:00',ST_GeomFromText('POINT(76.5900 11.7000)',4326,'axis-order=long-lat'),1.800,85.000,'Movebank','T002'),
(3,1,1,1,1,'2026-09-25 14:00:00',ST_GeomFromText('POINT(76.6200 11.7300)',4326,'axis-order=long-lat'),2.500,70.000,'Movebank','T003'),
(4,2,3,2,2,'2026-09-26 08:00:00',ST_GeomFromText('POINT(76.1500 12.0300)',4326,'axis-order=long-lat'),1.200,45.000,'Movebank','E001'),
(5,2,3,2,2,'2026-09-26 12:00:00',ST_GeomFromText('POINT(76.1800 12.0500)',4326,'axis-order=long-lat'),1.500,55.000,'Movebank','E002'),
(6,2,3,2,2,'2026-09-26 18:00:00',ST_GeomFromText('POINT(76.2200 12.0900)',4326,'axis-order=long-lat'),1.900,65.000,'Movebank','E003'),
(7,3,4,3,3,'2026-09-27 18:00:00',ST_GeomFromText('POINT(75.8000 11.6300)',4326,'axis-order=long-lat'),1.700,120.000,'Research Upload','L001'),
(8,3,4,3,3,'2026-09-28 18:00:00',ST_GeomFromText('POINT(75.8200 11.6500)',4326,'axis-order=long-lat'),1.900,125.000,'Research Upload','L002');

INSERT INTO KnowledgeArticle(article_id,created_by,species_id,region_id,title,content,article_type,status) VALUES
(1,4,1,1,'Bengal Tiger Conservation','Tigers require large connected habitats and sufficient prey populations.','SPECIES','PUBLISHED'),
(2,4,2,2,'Asian Elephant Habitat','Elephants use large forest ranges and require access to water and food.','HABITAT','PUBLISHED'),
(3,6,3,3,'Leopard Behaviour','Leopards are adaptable predators and can use diverse habitats.','BEHAVIOR','PUBLISHED');

INSERT INTO KnowledgeSource(article_id,source_title,source_url,publisher,publication_date,accessed_at) VALUES
(1,'IUCN Red List','https://www.iucnredlist.org/','IUCN','2026-01-01',CURRENT_TIMESTAMP),
(2,'IUCN Red List','https://www.iucnredlist.org/','IUCN','2026-01-01',CURRENT_TIMESTAMP),
(3,'Wildlife Research Reference','https://example.org/reference','Research Institute','2026-01-01',CURRENT_TIMESTAMP);

INSERT INTO EnvironmentalData(environmental_id,region_id,recorded_at,location,temperature_celsius,humidity_percent,rainfall_mm,heatwave_flag,source_name,external_record_id) VALUES
(1,1,'2026-09-25 12:00:00',ST_GeomFromText('POINT(76.6000 11.7000)',4326,'axis-order=long-lat'),31.50,58.00,0.00,FALSE,'Weather API','W001'),
(2,1,'2026-09-26 12:00:00',ST_GeomFromText('POINT(76.6100 11.7100)',4326,'axis-order=long-lat'),36.20,48.00,0.00,TRUE,'Weather API','W002'),
(3,2,'2026-09-26 12:00:00',ST_GeomFromText('POINT(76.1800 12.0500)',4326,'axis-order=long-lat'),29.00,72.00,4.20,FALSE,'Weather API','W003'),
(4,3,'2026-09-27 12:00:00',ST_GeomFromText('POINT(75.8200 11.6500)',4326,'axis-order=long-lat'),28.00,80.00,12.00,FALSE,'Weather API','W004');

INSERT INTO ConservationProject(project_id,institution_id,created_by,region_id,project_name,project_type,description,start_date,end_date,status,visibility) VALUES
(1,2,5,1,'Bandipur Tiger Conservation','SPECIES_CONSERVATION','Community-supported tiger conservation project','2026-08-01',NULL,'ONGOING','PUBLIC'),
(2,1,4,3,'Wayanad Biodiversity Survey','BIODIVERSITY_SURVEY','Survey of biodiversity and wildlife movement','2026-09-01','2027-03-31','ONGOING','PUBLIC'),
(3,1,6,2,'Elephant Movement Research','WILDLIFE_RESEARCH','Movement analysis using authorized tracking datasets','2026-08-15','2027-02-28','ONGOING','PUBLIC');

INSERT INTO ProjectSpecies(project_id,species_id) VALUES (1,1),(2,3),(2,4),(3,2);

INSERT INTO ProjectUpdate(project_id,posted_by,title,content) VALUES
(1,5,'Monthly field update','Recent tiger sightings were verified in the Bandipur study region.'),
(2,4,'Survey phase started','The first biodiversity survey phase has been completed.'),
(3,6,'Movement dataset imported','Authorized elephant movement records were added for analysis.');

INSERT INTO ResearchPublication(project_id,study_id,title,authors,journal_name,publication_year,doi,publication_url) VALUES
(1,1,'Tiger Movement and Habitat Use in Bandipur','Ravi Kumar; Meera Nair','Wildlife Research Journal',2026,'10.0000/example.tiger','https://doi.org/10.0000/example.tiger'),
(3,2,'Elephant Movement Analysis in Nagarhole','Meera Nair; Kavya Menon','Conservation Data Studies',2026,'10.0000/example.elephant','https://doi.org/10.0000/example.elephant');

INSERT INTO ConservationEvent(event_id,institution_id,region_id,created_by,event_name,event_type,description,start_datetime,end_datetime,location,registration_url,status) VALUES
(1,2,1,5,'Wildlife Awareness Program','AWARENESS','Public awareness event about wildlife conservation','2026-10-05 10:00:00','2026-10-05 13:00:00',ST_GeomFromText('POINT(76.5900 11.7000)',4326,'axis-order=long-lat'),'https://example.org/register','UPCOMING');

-- ============================================================
-- 4. PROCEDURES
-- ============================================================

DELIMITER $$

CREATE PROCEDURE GetSightingsBySpecies(IN p_species_id INT)
BEGIN
    SELECT si.sighting_id, sp.common_name AS species, r.region_name,
           si.sighting_time, si.status, si.description
    FROM Sighting si
    JOIN Species sp ON sp.species_id = si.species_id
    JOIN Region r ON r.region_id = si.region_id
    WHERE si.species_id = p_species_id
    ORDER BY si.sighting_time DESC;
END$$

CREATE PROCEDURE GetAuthorizedReports(IN p_user_id BIGINT)
BEGIN
    SELECT sr.report_id, sr.activity_type, r.region_name,
           sr.reported_at, sr.priority, sr.status, sr.description
    FROM SuspiciousReport sr
    JOIN Region r ON r.region_id = sr.region_id
    JOIN UserRegion ur ON ur.region_id = sr.region_id
    WHERE ur.user_id = p_user_id
    ORDER BY sr.reported_at DESC;
END$$

DELIMITER ;

-- Procedure demonstrations
CALL GetSightingsBySpecies(1);
CALL GetAuthorizedReports(2);

-- ============================================================
-- 5. FUNCTIONS
-- ============================================================

DELIMITER $$

CREATE FUNCTION CountVerifiedSightings(p_species_id INT)
RETURNS INT
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE total INT;
    SELECT COUNT(*) INTO total
    FROM Sighting
    WHERE species_id = p_species_id AND status = 'VERIFIED';
    RETURN total;
END$$

CREATE FUNCTION SpeciesConservationLevel(p_species_id INT)
RETURNS VARCHAR(30)
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_status VARCHAR(100);
    SELECT conservation_status INTO v_status
    FROM Species WHERE species_id = p_species_id;

    IF v_status = 'Critically Endangered' THEN RETURN 'CRITICAL';
    ELSEIF v_status = 'Endangered' THEN RETURN 'HIGH';
    ELSEIF v_status = 'Vulnerable' THEN RETURN 'MEDIUM';
    ELSE RETURN 'LOW';
    END IF;
END$$

DELIMITER ;

SELECT species_id, common_name, CountVerifiedSightings(species_id) AS verified_sightings
FROM Species;

SELECT species_id, common_name, SpeciesConservationLevel(species_id) AS conservation_level
FROM Species;

-- ============================================================
-- 6. TRIGGERS
-- ============================================================

DELIMITER $$

CREATE TRIGGER trg_suspicious_report_audit
AFTER INSERT ON SuspiciousReport
FOR EACH ROW
BEGIN
    INSERT INTO AuditLog(user_id,action_type,table_name,record_id,action_description)
    VALUES(NEW.reported_by,'INSERT','SuspiciousReport',NEW.report_id,'New suspicious wildlife report created');
END$$

CREATE TRIGGER trg_sighting_audit
AFTER INSERT ON Sighting
FOR EACH ROW
BEGIN
    INSERT INTO AuditLog(user_id,action_type,table_name,record_id,action_description)
    VALUES(NEW.reported_by,'INSERT','Sighting',NEW.sighting_id,'New wildlife sighting submitted');
END$$

CREATE TRIGGER trg_report_status_audit
AFTER UPDATE ON SuspiciousReport
FOR EACH ROW
BEGIN
    IF OLD.status <> NEW.status THEN
        INSERT INTO AuditLog(user_id,action_type,table_name,record_id,action_description)
        VALUES(NEW.reported_by,'UPDATE','SuspiciousReport',NEW.report_id,
               CONCAT('Report status changed from ',OLD.status,' to ',NEW.status));
    END IF;
END$$

CREATE TRIGGER trg_movement_species_validation
BEFORE INSERT ON MovementPoint
FOR EACH ROW
BEGIN
    DECLARE animal_species INT;
    IF NEW.animal_id IS NOT NULL THEN
        SELECT species_id INTO animal_species FROM Animal WHERE animal_id = NEW.animal_id;
        IF animal_species <> NEW.species_id THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Movement species does not match animal species';
        END IF;
    END IF;
END$$

DELIMITER ;

-- Trigger demonstrations
INSERT INTO SuspiciousReport(reported_by,region_id,activity_type,location,description,status,priority)
VALUES(5,3,'OTHER',ST_GeomFromText('POINT(75.8500 11.6800)',4326,'axis-order=long-lat'),'Test report for trigger demonstration','PENDING','LOW');

UPDATE SuspiciousReport SET status='UNDER_INVESTIGATION' WHERE report_id=4;
SELECT * FROM AuditLog ORDER BY audit_id DESC;

-- ============================================================
-- 7. NESTED QUERIES
-- ============================================================

-- 7.1 Species having more verified sightings than the average species count
SELECT s.species_id, s.common_name
FROM Species s
WHERE s.species_id IN (
    SELECT si.species_id
    FROM Sighting si
    WHERE si.status='VERIFIED' AND si.species_id IS NOT NULL
    GROUP BY si.species_id
    HAVING COUNT(*) > (
        SELECT AVG(x.sighting_count)
        FROM (
            SELECT COUNT(*) AS sighting_count
            FROM Sighting
            WHERE status='VERIFIED' AND species_id IS NOT NULL
            GROUP BY species_id
        ) x
    )
);

-- 7.2 Regions containing at least one high-priority report
SELECT region_name
FROM Region
WHERE region_id IN (
    SELECT region_id
    FROM SuspiciousReport
    WHERE priority='HIGH' OR priority='CRITICAL'
);

-- 7.3 Species with at least one movement record
SELECT common_name
FROM Species
WHERE species_id IN (
    SELECT DISTINCT species_id FROM MovementPoint
);

-- ============================================================
-- 8. CORRELATED QUERIES
-- ============================================================

-- 8.1 Latest sighting for each species
SELECT si.sighting_id, si.species_id, sp.common_name, si.sighting_time, si.status
FROM Sighting si
JOIN Species sp ON sp.species_id=si.species_id
WHERE si.sighting_time = (
    SELECT MAX(s2.sighting_time)
    FROM Sighting s2
    WHERE s2.species_id = si.species_id
);

-- 8.2 Species that have movement data in their current animal regions
SELECT s.species_id, s.common_name
FROM Species s
WHERE EXISTS (
    SELECT 1
    FROM Animal a
    JOIN MovementPoint m ON m.animal_id=a.animal_id
    WHERE a.species_id=s.species_id
      AND m.region_id=a.current_region_id
);

-- 8.3 Latest movement point for each animal
SELECT m.movement_id,m.animal_id,m.observed_at,m.location
FROM MovementPoint m
WHERE m.observed_at = (
    SELECT MAX(m2.observed_at)
    FROM MovementPoint m2
    WHERE m2.animal_id=m.animal_id
);

-- ============================================================
-- 9. VIEWS
-- ============================================================

CREATE OR REPLACE VIEW VerifiedWildlifeSightings AS
SELECT si.sighting_id, sp.common_name AS species,
       r.region_name, h.habitat_name, si.sighting_time,
       si.description, si.status
FROM Sighting si
LEFT JOIN Species sp ON sp.species_id=si.species_id
JOIN Region r ON r.region_id=si.region_id
LEFT JOIN Habitat h ON h.habitat_id=si.habitat_id
WHERE si.status='VERIFIED';

CREATE OR REPLACE VIEW PublicConservationProjects AS
SELECT cp.project_id, cp.project_name, cp.project_type,
       i.institution_name, r.region_name, cp.start_date,
       cp.end_date, cp.status
FROM ConservationProject cp
LEFT JOIN Institution i ON i.institution_id=cp.institution_id
JOIN Region r ON r.region_id=cp.region_id
WHERE cp.visibility='PUBLIC';

CREATE OR REPLACE VIEW AnimalMovementSummary AS
SELECT a.animal_id, a.animal_identifier,
       s.common_name AS species,
       r.region_name,
       COUNT(m.movement_id) AS movement_points,
       MIN(m.observed_at) AS first_observation,
       MAX(m.observed_at) AS last_observation
FROM Animal a
JOIN Species s ON s.species_id=a.species_id
LEFT JOIN MovementPoint m ON m.animal_id=a.animal_id
LEFT JOIN Region r ON r.region_id=a.current_region_id
GROUP BY a.animal_id,a.animal_identifier,s.common_name,r.region_name;

SELECT * FROM VerifiedWildlifeSightings;
SELECT * FROM PublicConservationProjects;
SELECT * FROM AnimalMovementSummary;

-- ============================================================
-- 10. TRANSACTIONS
-- ============================================================

-- Transaction 1: assign a suspicious report to a ranger and create investigation
START TRANSACTION;

UPDATE SuspiciousReport
SET status='UNDER_INVESTIGATION'
WHERE report_id=1;

INSERT INTO Investigation(report_id,ranger_id,findings,status)
VALUES(1,2,'Initial investigation started for possible poaching report.','IN_PROGRESS');

COMMIT;

SELECT * FROM SuspiciousReport WHERE report_id=1;
SELECT * FROM Investigation WHERE report_id=1;

-- Transaction 2: demonstrate rollback
START TRANSACTION;

UPDATE SuspiciousReport
SET priority='CRITICAL'
WHERE report_id=2;

INSERT INTO InvestigationNote(investigation_id,ranger_id,note_text)
VALUES(1,2,'Temporary transaction test note.');

ROLLBACK;

SELECT report_id,priority FROM SuspiciousReport WHERE report_id=2;
SELECT * FROM InvestigationNote WHERE note_text='Temporary transaction test note.';
