export interface GeoCity {
  slug: string;
  city: string;
  state: string;
  stateCode: string;
  usdaZone: string;
  population: string;
  landscapingSeasonDesc: string;
  topPlants: string[];
  commonServices: string[];
  averageProjectSize: string;
  marketInsight: string;
}

export const GEO_CITIES: GeoCity[] = [
  {
    slug: "austin",
    city: "Austin",
    state: "Texas",
    stateCode: "TX",
    usdaZone: "8b",
    population: "979,000+",
    landscapingSeasonDesc: "year-round with peak demand from March through October",
    topPlants: [
      "Texas Sage (Leucophyllum frutescens)",
      "Flame Acanthus (Anisacanthus quadrifidus var. wrightii)",
      "Lindheimer Muhly (Muhlenbergia lindheimeri)",
      "Mexican Honeysuckle (Justicia spicigera)",
      "Blackfoot Daisy (Melampodium leucanthum)",
    ],
    commonServices: [
      "Xeriscaping & drought-tolerant design",
      "Patio & outdoor living spaces",
      "Irrigation system installation",
      "Native plant restoration",
    ],
    averageProjectSize: "$4,000–$18,000",
    marketInsight:
      "Austin's rapid population growth — consistently among the fastest-growing metros in the US — drives constant demand for new residential and commercial landscaping. Water restrictions imposed by Austin Water encourage xeriscaping and native-plant designs, making zone-aware proposal tools especially valuable. Landscapers who can demonstrate drought-tolerant expertise in their proposals win more bids in this competitive market.",
  },
  {
    slug: "denver",
    city: "Denver",
    state: "Colorado",
    stateCode: "CO",
    usdaZone: "5b",
    population: "713,000+",
    landscapingSeasonDesc: "March through November",
    topPlants: [
      "Blue Avena Grass (Helictotrichon sempervirens)",
      "Rabbitbrush (Ericameria nauseosa)",
      "Rocky Mountain Penstemon (Penstemon strictus)",
      "Karl Foerster Feather Reed Grass (Calamagrostis x acutiflora)",
      "Apache Plume (Fallugia paradoxa)",
    ],
    commonServices: [
      "Water-wise landscape design",
      "Hardscaping & retaining walls",
      "Seasonal lawn renovation",
      "Snow-damage repair & spring cleanup",
    ],
    averageProjectSize: "$3,500–$15,000",
    marketInsight:
      "Denver's semi-arid climate and strict water regulations drive strong demand for water-wise landscaping. The city's lawn-replacement rebate programs encourage homeowners to convert turf to xeric gardens, creating a steady pipeline of projects for landscapers. A compressed growing season means scheduling precision is critical — teams that can turn around proposals quickly capture more revenue during the busy spring-to-fall window.",
  },
  {
    slug: "portland",
    city: "Portland",
    state: "Oregon",
    stateCode: "OR",
    usdaZone: "8b",
    population: "641,000+",
    landscapingSeasonDesc: "March through November with mild winters allowing some year-round work",
    topPlants: [
      "Sword Fern (Polystichum munitum)",
      "Oregon Grape (Mahonia aquifolium)",
      "Red Flowering Currant (Ribes sanguineum)",
      "Pacific Dogwood (Cornus nuttallii)",
      "Nootka Rose (Rosa nutkana)",
    ],
    commonServices: [
      "Rain garden & bioswale installation",
      "Native habitat restoration",
      "Edible & permaculture garden design",
      "Deck & patio integration",
    ],
    averageProjectSize: "$3,000–$14,000",
    marketInsight:
      "Portland homeowners prioritize sustainability, native plants, and eco-friendly practices more than almost any other US market. The city's green infrastructure incentives for rain gardens and bioswales create unique upsell opportunities. Landscapers who highlight environmental benefits and native-plant expertise in their proposals have a significant competitive advantage in this environmentally conscious market.",
  },
  {
    slug: "phoenix",
    city: "Phoenix",
    state: "Arizona",
    stateCode: "AZ",
    usdaZone: "9b",
    population: "1,650,000+",
    landscapingSeasonDesc: "year-round with reduced activity during peak summer heat (June through August)",
    topPlants: [
      "Desert Marigold (Baileya multiradiata)",
      "Palo Verde (Parkinsonia florida)",
      "Red Yucca (Hesperaloe parviflora)",
      "Bougainvillea (Bougainvillea spp.)",
      "Agave (Agave americana)",
    ],
    commonServices: [
      "Desert-adapted landscape design",
      "Artificial turf installation",
      "Pool-area landscaping",
      "Drip irrigation system design",
    ],
    averageProjectSize: "$3,500–$16,000",
    marketInsight:
      "As the fifth-largest city in the US, Phoenix has an enormous and growing landscaping market driven by relentless new construction. Extreme heat and water scarcity make desert-adapted plant knowledge non-negotiable — homeowners expect proposals that include low-water, heat-tolerant species. Landscapers who can quickly generate professional proposals with accurate desert plant palettes close deals faster in a market where speed matters as much as expertise.",
  },
  {
    slug: "dallas",
    city: "Dallas",
    state: "Texas",
    stateCode: "TX",
    usdaZone: "8a",
    population: "1,340,000+",
    landscapingSeasonDesc: "year-round with peak demand from March through November",
    topPlants: [
      "Crape Myrtle (Lagerstroemia indica)",
      "Mexican Plum (Prunus mexicana)",
      "Cedar Sage (Salvia roemeriana)",
      "Gulf Muhly (Muhlenbergia capillaris)",
      "Turk's Cap (Malvaviscus arboreus var. drummondii)",
    ],
    commonServices: [
      "Full yard design & installation",
      "Outdoor kitchen & living areas",
      "Seasonal color planting programs",
      "Commercial property maintenance",
    ],
    averageProjectSize: "$4,500–$20,000",
    marketInsight:
      "Dallas-Fort Worth's booming housing market generates a massive pipeline of new-construction landscaping projects, while established neighborhoods fuel renovation demand. The region's clay-heavy blackland prairie soils and hot summers require landscapers with specific local knowledge. Professional proposals that demonstrate expertise in soil amendment and heat-tolerant plant selection help landscapers stand out in this crowded, high-value market.",
  },
  {
    slug: "atlanta",
    city: "Atlanta",
    state: "Georgia",
    stateCode: "GA",
    usdaZone: "7b",
    population: "499,000+",
    landscapingSeasonDesc: "year-round with peak activity from March through November",
    topPlants: [
      "Oakleaf Hydrangea (Hydrangea quercifolia)",
      "Southern Magnolia (Magnolia grandiflora)",
      "Eastern Redbud (Cercis canadensis)",
      "Lenten Rose (Helleborus orientalis)",
      "Sweetspire (Itea virginica)",
    ],
    commonServices: [
      "Full landscape design & renovation",
      "Hardscaping & stone pathways",
      "Drainage solutions & grading",
      "Outdoor lighting design",
    ],
    averageProjectSize: "$3,500–$15,000",
    marketInsight:
      "Atlanta's mix of established intown neighborhoods and fast-growing suburbs creates diverse opportunities for landscapers — from historic garden renovations to new-build installations. Heavy rainfall and clay soils make drainage planning a critical component of every proposal. Landscapers who can visually demonstrate how a project handles water management alongside beautiful plantings win more contracts in this competitive Southeast market.",
  },
  {
    slug: "nashville",
    city: "Nashville",
    state: "Tennessee",
    stateCode: "TN",
    usdaZone: "7a",
    population: "689,000+",
    landscapingSeasonDesc: "March through November",
    topPlants: [
      "Tennessee Coneflower (Echinacea tennesseensis)",
      "Winterberry Holly (Ilex verticillata)",
      "Virginia Sweetspire (Itea virginica)",
      "Switchgrass (Panicum virgatum)",
      "Bluestar (Amsonia tabernaemontana)",
    ],
    commonServices: [
      "Residential design & installation",
      "Patio & fire pit construction",
      "Erosion control & hillside planting",
      "Seasonal maintenance programs",
    ],
    averageProjectSize: "$3,000–$14,000",
    marketInsight:
      "Nashville's population surge and construction boom — particularly in neighborhoods like East Nashville, The Gulch, and Germantown — have made it one of the hottest landscaping markets in the Southeast. Hilly terrain creates demand for erosion-control expertise and terraced garden designs. Landscapers who generate polished proposals quickly gain an edge in a market flooded with new homeowners seeking outdoor living upgrades.",
  },
  {
    slug: "tampa",
    city: "Tampa",
    state: "Florida",
    stateCode: "FL",
    usdaZone: "9b",
    population: "403,000+",
    landscapingSeasonDesc: "year-round",
    topPlants: [
      "Coontie Palm (Zamia integrifolia)",
      "Firebush (Hamelia patens)",
      "Muhly Grass (Muhlenbergia capillaris)",
      "Simpson's Stopper (Myrcianthes fragrans)",
      "Sabal Palm (Sabal palmetto)",
    ],
    commonServices: [
      "Tropical landscape design",
      "Pool & waterfront landscaping",
      "Hurricane-resistant planting",
      "Sod & turf installation",
    ],
    averageProjectSize: "$3,000–$15,000",
    marketInsight:
      "Tampa's tropical climate supports year-round landscaping activity, giving local crews a longer revenue season than most US markets. Florida-friendly landscaping programs and hurricane-preparedness guidelines shape what homeowners expect in proposals. Landscapers who include wind-resistant species and demonstrate knowledge of Florida's unique plant regulations gain trust — and close more deals — in this fast-growing Gulf Coast market.",
  },
  {
    slug: "charlotte",
    city: "Charlotte",
    state: "North Carolina",
    stateCode: "NC",
    usdaZone: "7b",
    population: "897,000+",
    landscapingSeasonDesc: "March through November",
    topPlants: [
      "Carolina Jessamine (Gelsemium sempervirens)",
      "Knock Out Rose (Rosa 'Radrazz')",
      "Japanese Maple (Acer palmatum)",
      "Blue Star Juniper (Juniperus squamata 'Blue Star')",
      "Black-eyed Susan (Rudbeckia fulgida)",
    ],
    commonServices: [
      "New construction landscaping",
      "Outdoor living & entertainment spaces",
      "Irrigation & drainage systems",
      "Commercial property enhancement",
    ],
    averageProjectSize: "$3,500–$16,000",
    marketInsight:
      "Charlotte's status as one of the fastest-growing cities on the East Coast fuels relentless demand for new-construction landscaping and backyard upgrades in its sprawling suburban developments. The Piedmont region's four distinct seasons allow for diverse planting palettes. Landscapers who present professional, detailed proposals with seasonal color plans and hardscape integration consistently win over Charlotte's quality-conscious homeowners.",
  },
  {
    slug: "raleigh",
    city: "Raleigh",
    state: "North Carolina",
    stateCode: "NC",
    usdaZone: "7b",
    population: "482,000+",
    landscapingSeasonDesc: "March through November",
    topPlants: [
      "Eastern Bluestar (Amsonia tabernaemontana)",
      "Beautyberry (Callicarpa americana)",
      "Virginia Sweetspire (Itea virginica 'Henry's Garnet')",
      "Dwarf Fothergilla (Fothergilla gardenii)",
      "Aromatic Aster (Symphyotrichum oblongifolium)",
    ],
    commonServices: [
      "Residential landscape design",
      "Pollinator & native garden installation",
      "Retaining walls & grading",
      "Lawn care & seasonal renovation",
    ],
    averageProjectSize: "$3,000–$14,000",
    marketInsight:
      "Raleigh's Research Triangle region attracts highly educated homeowners who research landscapers thoroughly before hiring — professional proposals make a measurable difference in win rates. The area's rapid suburban expansion, especially in Wake and Durham counties, creates a deep pipeline of new-construction projects. Native plant and pollinator garden demand is growing fast in this market, rewarding landscapers who can demonstrate ecological expertise in their proposals.",
  },
];

/** Return all cities. */
export function getAllCities(): GeoCity[] {
  return GEO_CITIES;
}

/** Look up a single city by its URL slug. Returns `undefined` if not found. */
export function getCityBySlug(slug: string): GeoCity | undefined {
  return GEO_CITIES.find((c) => c.slug === slug);
}

/**
 * Return related cities for cross-linking, excluding the current city.
 * Returns a deterministic but varied selection based on the current slug.
 */
export function getRelatedCities(currentSlug: string, count: number): GeoCity[] {
  const others = GEO_CITIES.filter((c) => c.slug !== currentSlug);

  // Deterministic shuffle seeded by the slug so the selection is stable per page
  // but different for each city
  const seed = currentSlug
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);

  const shuffled = [...others].sort((a, b) => {
    const hashA =
      (seed * 31 + a.slug.charCodeAt(0)) % 997;
    const hashB =
      (seed * 31 + b.slug.charCodeAt(0)) % 997;
    return hashA - hashB;
  });

  return shuffled.slice(0, count);
}
