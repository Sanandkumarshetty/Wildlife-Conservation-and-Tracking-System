const habitats = new Map([
  ['Semnopithecus entellus', 'Found in a wide variety of habitats including dry and moist deciduous forests, tropical thorn forests, scrublands, sparsely wooded areas, savanna and areas close to human settlements.'],
  ['Axis axis', 'Typically found in grasslands, open woodlands, deciduous forests and forest edges, usually in areas with access to water.'],
  ['Bos frontalis', 'Found mainly in forested and hilly regions, including subtropical and tropical forests, forest edges and nearby grasslands.'],
  ['Elephas maximus', 'Occurs in tropical and subtropical forests, including evergreen, semi-evergreen and deciduous forests, as well as grasslands, scrublands and forest-edge habitats with access to water.'],
  ['Funambulus', 'Small arboreal squirrel generally associated with trees and wooded habitats. Species-level habitat information may vary depending on the exact species.'],
  ['Funambulus palmarum', 'Found in a variety of habitats including scrublands, deciduous forests, plantations, villages, gardens, parks and urban areas.'],
  ['Funambulus sublineatus', 'Associated primarily with forested habitats in the Western Ghats region, especially wooded and natural forest environments.'],
  ['Funambulus tristriatus', 'Found in moist deciduous forests, evergreen forests, dense wooded areas, pasturelands and plantations such as cardamom, tea and coffee plantations in the Western Ghats.'],
  ['Herpestes edwardsi', 'Found in a wide variety of habitats including forests, scrublands, grasslands, agricultural areas and areas close to human settlements.'],
  ['Herpestes vitticollis', 'Primarily found in forests and dense vegetation, including tropical forests, forest edges, plantations and areas with thick undergrowth.'],
  ['Macaca radiata', 'Occurs in tropical dry and moist forests, scrublands, plantations and areas near human settlements, including villages and urban environments.'],
  ['Macaca silenus', 'Primarily inhabits tropical evergreen and semi-evergreen rainforests of the Western Ghats, especially dense forest canopies.'],
  ['Muntiacus muntjak', 'Found in forests, dense woodland, scrublands, forest edges and areas with thick vegetation, often near water sources.'],
  ['Ratufa indica', 'An arboreal species found primarily in moist tropical forests and other mature forest habitats with large trees and connected canopy.'],
  ['Rusa unicolor', 'Found in tropical and subtropical forests, including deciduous forests, evergreen forests, woodland, forest edges and nearby grasslands.'],
  ['Semnopithecus hypoleucos', 'Found primarily in forests and wooded landscapes of the Western Ghats, including moist and deciduous forest habitats.'],
  ['Semnopithecus johnii', 'Primarily found in tropical evergreen and semi-evergreen forests of the Western Ghats, especially dense and relatively undisturbed forest habitats.'],
  ['Sus scrofa', 'Highly adaptable and found in forests, grasslands, scrublands, agricultural areas, wetlands and areas near human settlements.'],
]);

export function getSpeciesHabitat(scientificName) {
  const match = String(scientificName || '').match(/^([A-Z][a-z]+)(?:\s+([a-z]+))?/);
  if (!match) return null;
  return habitats.get([match[1], match[2]].filter(Boolean).join(' ')) || null;
}
