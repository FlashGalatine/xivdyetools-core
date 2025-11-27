#!/usr/bin/env node
/**
 * Build-time locale generator
 * Converts YAML + CSV → JSON locale files
 *
 * Usage: npm run build:locales
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';
import { parse as parseCsv } from 'csv-parse/sync';

interface YamlLabels {
  Dye: string | null;
  General_Purpose: string | null;
  Dark: string | null;
  Metallic: string | string[] | null;
  Pastel: string | null;
  Cosmic: string | null;
  Cosmic_Exploration: string | null;
  Cosmic_Fortunes: string | null;
}

interface CsvRow {
  itemID: string;
  'English Name': string;
  'Japanese Name': string;
  'German Name': string;
  'French Name': string;
}

interface Dye {
  itemID: number;
  name: string;
  category: string;
  hex: string;
  rgb: { r: number; g: number; b: number };
  hsv: { h: number; s: number; v: number };
  acquisition: string;
  price: number | null;
  currency: string | null;
}

type LocaleCode = 'en' | 'ja' | 'de' | 'fr';

const LOCALE_NAMES: Record<LocaleCode, string> = {
  en: 'English',
  ja: 'Japanese',
  de: 'German',
  fr: 'French',
};

async function main() {
  console.log('🌐 Building locale files...\n');

  // Use current working directory (where npm run is executed from)
  const workingDir = process.cwd();

  // Read YAML
  const yamlPath = path.join(workingDir, 'localize.yaml');
  const yamlContent = fs.readFileSync(yamlPath, 'utf-8');
  const yamlData: Record<string, YamlLabels> = yaml.parse(yamlContent);

  // Read CSV
  const csvPath = path.join(workingDir, 'dyenames.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const csvRows: CsvRow[] = parseCsv(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  // Read colors_xiv.json for metallic dye IDs and categories
  const colorsPath = path.join(workingDir, 'src', 'data', 'colors_xiv.json');
  const colorsData: Dye[] = JSON.parse(fs.readFileSync(colorsPath, 'utf-8'));

  // Build each locale
  const locales: LocaleCode[] = ['en', 'ja', 'de', 'fr'];
  const outputDir = path.join(workingDir, 'src', 'data', 'locales');

  // Ensure output directory exists
  fs.mkdirSync(outputDir, { recursive: true });

  for (const locale of locales) {
    console.log(`Building ${LOCALE_NAMES[locale]} (${locale})...`);

    const localeData = buildLocaleData(locale, yamlData, csvRows, colorsData);
    const outputPath = path.join(outputDir, `${locale}.json`);

    fs.writeFileSync(outputPath, JSON.stringify(localeData, null, 2), 'utf-8');
    console.log(`  ✓ Wrote ${outputPath} (${localeData.meta.dyeCount} dyes)\n`);
  }

  console.log('✅ Locale files built successfully!');
}

function buildLocaleData(
  locale: LocaleCode,
  yamlData: Record<string, YamlLabels>,
  csvRows: CsvRow[],
  colorsData: Dye[]
) {
  const labels = buildLabels(locale, yamlData[locale]);
  const dyeNames = buildDyeNames(locale, csvRows);
  const categories = buildCategories(locale);
  const metallicDyeIds = identifyMetallicDyes(colorsData);

  return {
    locale,
    meta: {
      version: '1.0.0',
      generated: new Date().toISOString(),
      dyeCount: Object.keys(dyeNames).length,
    },
    labels,
    dyeNames,
    categories,
    acquisitions: buildAcquisitions(locale),
    metallicDyeIds,
    harmonyTypes: buildHarmonyTypes(locale),
    visionTypes: buildVisionTypes(locale),
  };
}

function buildLabels(locale: LocaleCode, yamlLabels: YamlLabels): Record<string, string> {
  const labels: Record<string, string> = {};

  // Add non-null labels
  if (yamlLabels.Dye) labels.dye = yamlLabels.Dye;
  if (yamlLabels.Dark) labels.dark = yamlLabels.Dark;

  // Handle French Metallic array - take first value
  if (yamlLabels.Metallic) {
    labels.metallic = Array.isArray(yamlLabels.Metallic)
      ? yamlLabels.Metallic[0]
      : yamlLabels.Metallic;
  }

  if (yamlLabels.Pastel) labels.pastel = yamlLabels.Pastel;
  if (yamlLabels.Cosmic) labels.cosmic = yamlLabels.Cosmic;
  if (yamlLabels.Cosmic_Exploration) labels.cosmicExploration = yamlLabels.Cosmic_Exploration;
  if (yamlLabels.Cosmic_Fortunes) labels.cosmicFortunes = yamlLabels.Cosmic_Fortunes;

  return labels;
}

function buildDyeNames(locale: LocaleCode, csvRows: CsvRow[]): Record<string, string> {
  const nameColumn = `${LOCALE_NAMES[locale]} Name` as keyof CsvRow;
  const dyeNames: Record<string, string> = {};

  for (const row of csvRows) {
    const itemID = row.itemID.trim();
    const name = row[nameColumn]?.trim();

    if (itemID && name) {
      dyeNames[itemID] = name;
    }
  }

  return dyeNames;
}

function buildCategories(locale: LocaleCode): Record<string, string> {
  // Hardcoded category translations
  const translations: Record<LocaleCode, Record<string, string>> = {
    en: {
      Neutral: 'Neutral',
      Reds: 'Reds',
      Blues: 'Blues',
      Browns: 'Browns',
      Greens: 'Greens',
      Yellows: 'Yellows',
      Purples: 'Purples',
      Special: 'Special',
      Facewear: 'Facewear',
    },
    ja: {
      Neutral: 'ニュートラル',
      Reds: '赤系',
      Blues: '青系',
      Browns: '茶系',
      Greens: '緑系',
      Yellows: '黄系',
      Purples: '紫系',
      Special: '特殊',
      Facewear: 'フェイスウェア',
    },
    de: {
      Neutral: 'Neutral',
      Reds: 'Rot',
      Blues: 'Blau',
      Browns: 'Braun',
      Greens: 'Grün',
      Yellows: 'Gelb',
      Purples: 'Violett',
      Special: 'Spezial',
      Facewear: 'Gesichtsschmuck',
    },
    fr: {
      Neutral: 'Neutre',
      Reds: 'Rouges',
      Blues: 'Bleus',
      Browns: 'Marrons',
      Greens: 'Verts',
      Yellows: 'Jaunes',
      Purples: 'Violets',
      Special: 'Spécial',
      Facewear: 'Accessoires faciaux',
    },
  };

  return translations[locale];
}

function buildAcquisitions(locale: LocaleCode): Record<string, string> {
  // Hardcoded acquisition translations
  const translations: Record<LocaleCode, Record<string, string>> = {
    en: {
      'Dye Vendor': 'Dye Vendor',
      Crafting: 'Crafting',
      'Ixali Vendor': 'Ixali Vendor',
      'Sylphic Vendor': 'Sylphic Vendor',
      "Amalj'aa Vendor": "Amalj'aa Vendor",
      'Sahagin Vendor': 'Sahagin Vendor',
      'Kobold Vendor': 'Kobold Vendor',
      'Cosmic Exploration': 'Cosmic Exploration',
      'Cosmic Fortunes': 'Cosmic Fortunes',
      'Venture Coffers': 'Venture Coffers',
      'Facewear Collection': 'Facewear Collection',
    },
    ja: {
      'Dye Vendor': '染料販売業者',
      Crafting: '製作',
      'Ixali Vendor': 'イクサル族のよろず屋',
      'Sylphic Vendor': 'シルフ族のよろず屋',
      "Amalj'aa Vendor": 'アマルジャ族のよろず屋',
      'Sahagin Vendor': 'サハギン族のよろず屋',
      'Kobold Vendor': 'コボルド族のよろず屋',
      'Cosmic Exploration': 'コスモエクスプローラー',
      'Cosmic Fortunes': 'コスモフォーチュン',
      'Venture Coffers': 'リテイナーの宝箱',
      'Facewear Collection': 'フェイスウェアコレクション',
    },
    de: {
      'Dye Vendor': 'Farbstoffverkäufer',
      Crafting: 'Handwerker',
      'Ixali Vendor': 'Ixal-Händler',
      'Sylphic Vendor': 'Sylphen-Händlerin',
      "Amalj'aa Vendor": "Amalj'aa-Händler",
      'Sahagin Vendor': 'Sahagin-Händler',
      'Kobold Vendor': 'Kobold-Händler',
      'Cosmic Exploration': 'Kosmo-Erkundung',
      'Cosmic Fortunes': 'Kosmo-Glück',
      'Venture Coffers': 'Gehilfen-Schatzkiste',
      'Facewear Collection': 'Gesichtsschmuck-Sammlung',
    },
    fr: {
      'Dye Vendor': 'Vendeur de teinture',
      Crafting: 'Artisanat',
      'Ixali Vendor': 'Vendeur ixal',
      'Sylphic Vendor': 'Vendeur sylphe',
      "Amalj'aa Vendor": "Vendeur amalj'aa",
      'Sahagin Vendor': 'Vendeur sahuagin',
      'Kobold Vendor': 'Vendeur kobold',
      'Cosmic Exploration': "l'exploration cosmique",
      'Cosmic Fortunes': 'Roue de la fortune cosmique',
      'Venture Coffers': 'Trouvaille de servant',
      'Facewear Collection': 'Collection accessoires faciaux',
    },
  };

  return translations[locale];
}

function identifyMetallicDyes(colorsData: Dye[]): number[] {
  // Identify all metallic dyes based on name prefix "Metallic"
  const metallicDyes = colorsData.filter((dye) => dye.name.startsWith('Metallic'));

  return metallicDyes
    .map((dye) => dye.itemID)
    .filter((id) => id !== null)
    .sort((a, b) => a - b);
}

function buildHarmonyTypes(locale: LocaleCode): Record<string, string> {
  // Hardcoded harmony type translations
  const translations: Record<LocaleCode, Record<string, string>> = {
    en: {
      complementary: 'Complementary',
      analogous: 'Analogous',
      triadic: 'Triadic',
      splitComplementary: 'Split-Complementary',
      tetradic: 'Tetradic',
      square: 'Square',
      monochromatic: 'Monochromatic',
      compound: 'Compound',
      shades: 'Shades',
    },
    ja: {
      complementary: '補色',
      analogous: '類似色',
      triadic: '三色配色',
      splitComplementary: '分裂補色',
      tetradic: '四色配色',
      square: '正方形配色',
      monochromatic: '単色',
      compound: '複合',
      shades: 'シェード',
    },
    de: {
      complementary: 'Komplementär',
      analogous: 'Analog',
      triadic: 'Triadisch',
      splitComplementary: 'Geteiltes Komplement',
      tetradic: 'Tetradisch',
      square: 'Quadrat',
      monochromatic: 'Monochromatisch',
      compound: 'Zusammengesetzt',
      shades: 'Schattierungen',
    },
    fr: {
      complementary: 'Complémentaire',
      analogous: 'Analogue',
      triadic: 'Triadique',
      splitComplementary: 'Complémentaire divisé',
      tetradic: 'Tétradique',
      square: 'Carré',
      monochromatic: 'Monochromatique',
      compound: 'Composé',
      shades: 'Nuances',
    },
  };

  return translations[locale];
}

function buildVisionTypes(locale: LocaleCode): Record<string, string> {
  // Hardcoded vision type translations
  const translations: Record<LocaleCode, Record<string, string>> = {
    en: {
      normal: 'Normal Vision',
      deuteranopia: 'Deuteranopia (Red-Green Colorblindness)',
      protanopia: 'Protanopia (Red-Green Colorblindness)',
      tritanopia: 'Tritanopia (Blue-Yellow Colorblindness)',
      achromatopsia: 'Achromatopsia (Total Colorblindness)',
    },
    ja: {
      normal: '正常視覚',
      deuteranopia: '2型色覚（赤緑色盲）',
      protanopia: '1型色覚（赤緑色盲）',
      tritanopia: '3型色覚（青黄色盲）',
      achromatopsia: '全色盲',
    },
    de: {
      normal: 'Normales Sehen',
      deuteranopia: 'Deuteranopie (Rot-Grün-Farbenblindheit)',
      protanopia: 'Protanopie (Rot-Grün-Farbenblindheit)',
      tritanopia: 'Tritanopie (Blau-Gelb-Farbenblindheit)',
      achromatopsia: 'Achromatopsie (Totale Farbenblindheit)',
    },
    fr: {
      normal: 'Vision normale',
      deuteranopia: 'Deutéranopie (Daltonisme rouge-vert)',
      protanopia: 'Protanopie (Daltonisme rouge-vert)',
      tritanopia: 'Tritanopie (Daltonisme bleu-jaune)',
      achromatopsia: 'Achromatopsie (Daltonisme total)',
    },
  };

  return translations[locale];
}

main().catch((error) => {
  console.error('❌ Error building locales:', error);
  process.exit(1);
});
