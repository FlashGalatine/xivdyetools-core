# FFXIV Official Localization Reference

This document contains verified official FFXIV localized terms used by the xivdyetools-core library.

> **Last Updated:** 2025-11-30
> **Supported Languages:** English (EN), Japanese (JA), German (DE), French (FR), Korean (KO), Chinese (ZH)

---

## Core Terms

| English | Japanese (JA) | German (DE) | French (FR) | Korean (KO) | Chinese (ZH) |
|---------|---------------|-------------|-------------|-------------|--------------|
| Dye | カララント | Farbstoff | Teinture | 염료 | 染剂 |
| Market Board | マーケットボード | Marktbrett | Tableau des ventes | 마켓보드 | 市场布告板 |
| Dark | ダーク | Dunkel- | foncé | 짙은 | 黑暗 |
| Pastel | パステル | Pastell- | pastel | 부드러운 | 柔彩 |
| Metallic | メタリック | Metallic | métallique | 금속질 | 金属 |
| Cosmic Exploration | コスモエクスプローラー | Kosmo-Erkundung | l'exploration cosmique | 코스모 탐사 | 宇宙探索 |
| Cosmic Fortunes | コスモフォーチュン | Kosmo-Glück | Roue de la fortune cosmique | 코스모 행운 | 宇宙幸运 |
| Venture Coffers | リテイナーの宝箱 | Gehilfen-Schatzkiste | Trouvaille de servant | 집사의 보물상자 | 雇员宝箱 |

---

## Allied Society Vendors (Beast Tribe Vendors)

| English | Japanese (JA) | German (DE) | French (FR) | Korean (KO) | Chinese (ZH) |
|---------|---------------|-------------|-------------|-------------|--------------|
| Allied Society Vendors | 友好部族 | Freundesvölker | Peuples alliés | 우호 부족 | 友好部族 |
| Ixali Vendor | イクサル族のよろず屋 | Ixal-Händler | Vendeur ixal | 익살 상인 | 鸟人商人 |
| Sylphic Vendor | シルフ族のよろず屋 | Sylphen-Händlerin | Vendeur sylphe | 실프 상인 | 妖精商人 |
| Kobold Vendor | コボルド族のよろず屋 | Kobold-Händler | Vendeur kobold | 코볼드 상인 | 钴铁商人 |
| Amalj'aa Vendor | アマルジャ族のよろず屋 | Amalj'aa-Händler | Vendeur amalj'aa | 아말쟈 상인 | 阿马尔贾商人 |
| Sahagin Vendor | サハギン族のよろず屋 | Sahagin-Händler | Vendeur sahuagin | 사하긴 상인 | 鱼人商人 |

---

## Beast Tribe Names

| English | Japanese (JA) | German (DE) | French (FR) | Korean (KO) | Chinese (ZH) |
|---------|---------------|-------------|-------------|-------------|--------------|
| Ixali | イクサル族 | Ixal | Ixal | 익살족 | 鸟人族 |
| Sylph | シルフ族 | Sylphen | Sylphes | 실프족 | 妖精族 |
| Kobold | コボルド族 | Kobolde | Kobolds | 코볼드족 | 钴铁族 |
| Amalj'aa | アマルジャ族 | Amalj'aa | Amalj'aa | 아말쟈족 | 阿马尔贾族 |
| Sahagin | サハギン族 | Sahagin | Sahuagin | 사하긴족 | 鱼人族 |

---

## Dye Name Format Pattern

The locale files store **color names only** (without the "Dye" suffix). The full item name in FFXIV includes the dye/colorant prefix/suffix:

| Language | Locale Stores | In-Game Full Name Pattern |
|----------|---------------|---------------------------|
| EN | Snow White | Snow White **Dye** |
| JA | スノウホワイト | **カララント:**スノウホワイト |
| DE | Schneeweißer | Schneeweißer **Farbstoff** |
| FR | blanc neige | **Teinture** blanc neige |
| KO | 하얀 눈색 | 하얀 눈색 **염료** |
| ZH | 素雪白 | 素雪白**染剂** |

This design allows the application to display either the short color name or the full item name as needed.

---

## Localization Notes

### Japanese (JA)
- "Dye" is translated as カララント (kararanto), derived from the English word "colorant"
- Beast tribe vendors use the pattern: [族名]族のよろず屋 ("general store of [tribe name] tribe")

### German (DE)
- Dye modifiers use hyphenated prefixes: Dunkel-, Pastell-, Metallic-
- "Retainer" is translated as "Gehilfen" (helper/assistant)
- German translators work directly from the Japanese source

### French (FR)
- Sahagin is spelled "Sahuagin" (with 'u') in French localization
- Venture Coffers = "Trouvaille de servant" (Servant's Find)
- Cosmic Fortunes = "Roue de la fortune cosmique" (Cosmic Fortune Wheel)

### Korean (KO)
- Beast tribe names use the pattern: [족명]족 (e.g., 익살족 for Ixali)
- "Venture Coffers" = 집사의 보물상자 (Butler's Treasure Chest)

### Chinese (ZH)
- Market Board = 市场布告板 (Market Bulletin Board)
- Beast tribes use descriptive names (e.g., 鸟人族 = "Bird People Tribe" for Ixali)

---

## Sources

### Official Sources
- [FFXIV Official Lodestone (NA)](https://na.finalfantasyxiv.com/lodestone/)
- [FFXIV Official Lodestone (DE)](https://de.finalfantasyxiv.com/lodestone/)
- [FFXIV Official Lodestone (FR)](https://fr.finalfantasyxiv.com/lodestone/)
- [FFXIV Official Lodestone (JP)](https://jp.finalfantasyxiv.com/lodestone/)

### Community Databases
- [ERIONES XIV Database (JP)](https://eriones.com/)
- [ERIONES XIV Database (DE)](https://de.eriones.com/)
- [ERIONES XIV Database (FR)](https://fr.eriones.com/)
- [ERIONES XIV Database (EN)](https://en.eriones.com/)
- [Korean FFXIV Database](https://ff14.tar.to/)
- [Chinese FFXIV Wiki](https://ff14.huijiwiki.com/)

### Reference Guides
- [FFXIV Console Games Wiki - Allied Society Quests](https://ffxiv.consolegameswiki.com/wiki/Allied_Society_Quests)
- [Cosmic Exploration Guide - Icy Veins](https://www.icy-veins.com/ffxiv/cosmic-exploration)

---

## Changelog

### 2025-11-30
- Initial creation with verified terms for all 6 languages
- Added Venture Coffers translations
- Added Cosmic Exploration/Fortunes translations
- Added Allied Society Vendor translations
