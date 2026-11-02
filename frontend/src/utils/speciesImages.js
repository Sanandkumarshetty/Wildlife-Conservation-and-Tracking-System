// export const SPECIES_IMAGE_FALLBACK = '/wildlife-fallback.svg';

// export const speciesImageMap = Object.freeze({
//   'Axis axis': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/73/066_Chital_in_Ranthambore_National_Park_Photo_by_Giles_Laurent.jpg/960px-066_Chital_in_Ranthambore_National_Park_Photo_by_Giles_Laurent.jpg?utm_source=en.wikipedia.org&utm_campaign=index&utm_content=thumbnail',
//   'Bos frontalis': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSTsgOrDtqaxBt0U_kOHYplJiIxo1NOMs10b3_wEhzmu3bUqOtilToQlxX3erpY0LP1kg9sGvDDnDWv0NAKP5qCn2A1E3fXdKHmAiR9znZP&s=10',
//   'Elephas maximus': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQkSrUOQtaqN_5tA8xiq8KZIUXoLP2ZsY3jyajXgxYRntszjwgaBPtFuXI91HJtEPVpXoQ0o-A5iuLBYaGRJP7kr7z0de6bhvnV1gxeOf69qg&s=10',
//   Funambulus: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ8q2EWrgy9r8m9liWdYgghpbw5T504BgQ9YldSD_E_AsRZDZa0PYkQWaaqm2-l3ui3Yiy61PXev9QK-G-2ySDWVLKKVtcB4j2JXfnXfSMuEQ&s=10',
//   'Funambulus palmarum': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTQR729UzVjvbOxa17fqrp_7z9Kql3odVmZF3QR1fqkwYouZlZdZi3VIDlgzq30WxqyD7cSQOqgT38DpirfPK9rkukiYXkxUyrgLy2-k-Nt&s=10',
//   'Funambulus sublineatus': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS_kUuaX-Qi_gYneidHg3IEvjCJrNLGtBgNGxg_fIeXowbtpSJ5IW19n_PXBfjnY7U3vxoh_q8QcY1Vw6on72u9VpqabKGkTajE7v4YSV1q&s=10',
//   'Funambulus tristriatus': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTTMu3fwOuCSAfvBVAA5thuQUp8kHaIzQoovG7EV214j2Mfc66KaNtKli_Ccr1eomDQpknSAbAVE0KxHGadxwtC4iABXCTA0ERHUf_oVspe&s=10',
//   'Herpestes edwardsi': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTrRtlzCLjzz6W14M6gCH8y5nJgBayts2OBmVRiknXAZ_ucmZifh8EkMjF5mbaKRP7MFhGZIGTpZ-NoW6oNARWEkxebXYnWyO3Y-0pw5trz&s=10',
//   'Herpestes vitticollis': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQuLD6g9ORPX7ft7D4klu-HxQneFTJTB8WVQ3JC_2jsjTwxY8gvVqOUBN-RzgBU9Wm-9O6djXqFHuCn46MNKoTTz2a0QdmGkSObfGXNPp98&s=10',
//   'Macaca radiata': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcROV8rQPnWNe9X9xDvju6o3mai0bJGK9Cfj07RFIAXzn2xMQ5Wyop7y9Ev_PgzQUgY8a3dLbbOeeLERKwW0f41f8_qhxx_TAaH44iMcJ5NjHA&s=10',
//   'Macaca silenus': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRBVqU3lsMHhnrFXsuYT22LjBgC22kuJTIPuk3uJiqaq5Juu7M5U5-89jncyl_YEyVJ5SFB9QRTtYxrmD_wXPsGaUJ3RRNrCLhNIP0VfN7O&s=10',
//   'Muntiacus muntjak': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTkodLsHKRE4aCpzmlqsSnFLavcH2UkORXOwwxCGl8BIyKQwWz7Q4Z-R7Th2fQC65sqfLvR6yZiVhrhKjFpIZwENSIc7Ltj4wrClbDo69Wq&s=10',
//   'Ratufa indica': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTSnxb-Rk6py0tNkzEH7PV1yow6S3nQLp3Q9LJ3REimPk-OgiaZQnDp6JFjrgre4dNh8nOWEv2pGWwh5P4FMCrRUl3Sbjhd3nichCTobLaE&s=10',
//   'Rusa unicolor': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSMBlUgKF3HW_OxwQIfLb-k01YiWg06BtU6K8tmas2AF_V4CaMzuBlG-WMglwc_0kMYGBp0_DtrWiw5ISx1c7Dic0yPFvnpXLFGkspWzMfZ&s=10',
//   'Semnopithecus entellus': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRXyqfzrs5jsgxj80DCZh6uwTyN_iYJKWrl1v0FXLMHM9o2Yid6ybhkJdOvZA_XhXbunB-adK67qSYydw3TbWgpnvfvqc7owje5RXIM6vDw&s=10',
//   'Semnopithecus hypoleucos': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS5Do2DVIHJwNiFphXLesb1Dha02NYx__FkdsIZTgCN9EWCRgg2lvbN-bRFXRs-Dtxsa56hiH5pZWbdi8L9z04MTUndbm-lqz0asxHMzbwI8w&s=10',
//   'Semnopithecus johnii': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT9y9is46CK6be2stdwlRUh-8rUbw9b6vheL9q_KiQv6fMBEQ6K09qQUKX0YJLeRVUyQyOCv9n2zxIfesD-xHIzQBNhjhwTymZIwENrIMUt&s=10',
//   'Sus scrofa': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQWw76wdPoVj5KAg1sbIH3NliOv5LFQ5OBXefRyA-JSuOEEIxK-yj0cgnZTUZ6JZocVSsXlTqlKBcjewFSoaKsaZMfBDCxnbpfuGijr0hPxkQ&s=10',
// });

// const scientificNamesLongestFirst = Object.keys(speciesImageMap).sort((left, right) => right.length - left.length);

// function exactMappedTaxon(scientificName) {
//   const name = String(scientificName || '').trim().replace(/\s+/g, ' ');
//   if (Object.hasOwn(speciesImageMap, name)) return name;

//   // The imported scientific_name values may append a taxonomic authority,
//   // e.g. "Axis axis (Erxleben, 1777)". Only accept a mapped name followed by
//   // an authority boundary; a different epithet never matches a genus key.
//   return scientificNamesLongestFirst.find((mappedName) => {
//     if (!name.startsWith(`${mappedName} `)) return false;
//     const suffix = name.slice(mappedName.length).trimStart();
//     return /^[([]/.test(suffix) || /^[A-ZÀ-ÖØ-Þ]/.test(suffix);
//   }) || null;
// }

// export function getSpeciesImageUrl(species) {
//   const scientificName = species?.scientific_name || species?.scientificName;
//   const mappedTaxon = exactMappedTaxon(scientificName);
//   return mappedTaxon ? speciesImageMap[mappedTaxon] : SPECIES_IMAGE_FALLBACK;
// }
