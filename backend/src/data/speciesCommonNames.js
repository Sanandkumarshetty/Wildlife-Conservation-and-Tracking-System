const reviewedNames = new Map([
  ['Axis axis', 'Chital (Spotted Deer)'],
  ['Bos frontalis', 'Gayal (Mithun)'],
  ['Elephas maximus', 'Asian Elephant'],
  ['Funambulus', 'Palm Squirrels'],
  ['Funambulus palmarum', 'Indian Palm Squirrel'],
  ['Funambulus sublineatus', 'Nilgiri Striped Squirrel'],
  ['Funambulus tristriatus', 'Jungle Palm Squirrel'],
  ['Herpestes edwardsi', 'Indian Grey Mongoose'],
  ['Herpestes vitticollis', 'Stripe-necked Mongoose'],
  ['Macaca radiata', 'Bonnet Macaque'],
  ['Macaca silenus', 'Lion-tailed Macaque'],
  ['Muntiacus muntjak', 'Indian Muntjac (Barking Deer)'],
  ['Panthera pardus', 'Indian Leopard'],
  ['Panthera tigris', 'Bengal Tiger'],
  ['Ratufa indica', 'Indian Giant Squirrel'],
  ['Rusa unicolor', 'Sambar Deer'],
  ['Semnopithecus entellus', 'Hanuman Langur'],
  ['Semnopithecus hypoleucos', 'Malabar Sacred Langur'],
  ['Semnopithecus johnii', 'Nilgiri Langur'],
  ['Sus scrofa', 'Wild Boar'],
]);

export function getReviewedCommonName(scientificName) {
  const match = String(scientificName || '').match(/^([A-Z][a-z]+)(?:\s+([a-z]+))?/);
  if (!match) return null;
  const stem = [match[1], match[2]].filter(Boolean).join(' ');
  return reviewedNames.get(stem) || null;
}
