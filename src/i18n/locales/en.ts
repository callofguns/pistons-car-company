/**
 * The source-of-truth catalog. Every other locale file is typed against this one's key set
 * (`LocaleCatalog = Record<MessageKey, string>` in ../keys.ts), so adding a key here without
 * adding it to es.ts/fr.ts is a compile error, and so is a typo'd key at any call site.
 *
 * Flat, dotted string keys rather than a nested object - `keyof typeof en` gives an exact
 * string-literal union for free (a nested Paths<T> conditional type is slow to check and produces
 * unreadable errors), and it's what lets `Record<MessageKey, string>` catch missing/extra keys on
 * the other locales without a hand-written deep-required type.
 *
 * Key convention: `<domain>.<subject>.<role>`. Keys are semantic paths, not English strings - e.g.
 * `data.loanTier.medium.name` / `data.promoTier.medium.name` / `data.classification.medium.label`
 * are three different keys even though they're all "Medium" in English, because ES/FR need three
 * different words there (including gender agreement). Never key on the English source string.
 *
 * `{token}` interpolation reuses the convention already in src/data/rumorTemplates.ts. Plural
 * keys come in `_one`/`_other` sibling pairs (see plural() in ../t.ts) rather than a single key
 * with baked-in English pluralization logic.
 */
export const en = {
  // common - reused across many screens
  'common.back': 'Back',
  'common.skipTutorial': 'Skip tutorial',
  'common.mainMenu': 'Main Menu',
  'common.menu': 'Menu',
  'common.shop': 'Shop',
  'common.pause': 'Pause',
  'common.play': 'Play',
  'common.fastForward': 'Fast forward',
  'common.previous': 'Previous',
  'common.next': 'Next',
  'common.continue': '✓ CONTINUE',

  // company naming (step 1 of + NEW GAME)
  'companyNaming.heading': 'YOUR COMPANY NAME:',
  'companyNaming.placeholder': 'Enter company name:',

  // main menu - ALL CAPS is literal here too (MainMenuScreen.module.css's .buttons has no
  // text-transform), distinct from nav.* below even where the English word is the same.
  'menu.est': 'Est. {year}',
  'menu.play': 'PLAY ({companyName})',
  'menu.saves': 'SAVES',
  'menu.news': 'NEWS',
  'menu.language': 'LANGUAGE',

  // save slots screen
  'saveSlots.overwriteHeading': 'CHOOSE A SLOT TO OVERWRITE',
  'saveSlots.everySlotFull': 'Every slot is full - pick one to start "{name}" in. This can\'t be undone.',
  'saveSlots.emptySlot': 'Empty Slot',
  'saveSlots.tapAgainToOverwrite': 'Tap again to overwrite',
  'saveSlots.newGame': '+ NEW GAME',
  'saveSlots.confirmDelete': 'Confirm delete {name}',
  'saveSlots.delete': 'Delete {name}',

  // nav.* - Office Hub's nav cluster specifically (title case, no CSS text-transform there - see
  // OfficeHubScreen.tsx). Main Menu's SAVES/NEWS/LANGUAGE are a separate menu.* domain below: same
  // words, but ALL CAPS there (MainMenuScreen.module.css's .buttons has no text-transform either,
  // so the casing has to be literal) - keeping them as distinct keys is exactly the
  // Small/Medium/Large lesson from data.loanTier vs data.classification, applied to nav labels.
  'nav.research': 'R&D',
  'nav.promotion': 'Promo',
  'nav.models': 'Models',
  'nav.racing': 'Racing',
  'nav.staff': 'Staff',
  'nav.company': 'Company',
  'nav.news': 'News',

  // office hub
  'officeHub.sales': 'SALES',
  'officeHub.noModels': 'No models yet - design your first car.',
  'officeHub.createCar': '+ CREATE CAR',

  // bank / finance screen
  'bank.cashBalance': 'Cash balance',
  'bank.overdraftWarning': 'Balance is negative - overdraft interest is accruing daily until this recovers.',
  'bank.activeLoans': 'Active Loans',
  'bank.loanLabel': '{principal} @ {rate}/yr',
  'bank.loanValue': '{remaining} left · {payment}/mo',
  'bank.thisMonth': 'This Month',
  'bank.income': 'Income',
  'bank.expenses': 'Expenses',
  'bank.netProfit': 'Net profit',
  'bank.takeALoan': 'Take a Loan',
  'bank.rateAndTerm': '{rate}/yr · {months} months',
  'bank.perMonth': '{amount}/mo',
  'bank.takeLoan': 'TAKE LOAN',

  // transaction categories - shown as ledger line-item labels on the Finance screen
  'data.transactionCategory.Sales': 'Sales',
  'data.transactionCategory.Staff': 'Staff wages',
  'data.transactionCategory.HQOverhead': 'HQ overhead',
  'data.transactionCategory.Production': 'Production',
  'data.transactionCategory.Research': 'Research',
  'data.transactionCategory.Marketing': 'Marketing',
  'data.transactionCategory.Racing': 'Racing',
  'data.transactionCategory.LoanPrincipal': 'Loan principal',
  'data.transactionCategory.LoanInterest': 'Loan interest',
  'data.transactionCategory.OverdraftInterest': 'Overdraft interest',
  'data.transactionCategory.Other': 'Other',

  // employees screen
  'employees.growthTrend': 'Growth trend',
  'employees.advisorMessage': 'A high budget increases staff and production speed but can lead to corruption and reduced quality.',
  'employees.perMonth': '{amount} / month',
  'employees.level': '{level}/{max} Level',
  'employees.maxBatch': 'Max. allowed production batch',
  'employees.prodSpeed': 'Production speed',
  'employees.prodQuality': 'Production quality',

  // promotion screen
  'promotion.selectMethod': 'Select Promotion Method',
  'promotion.noModels': 'No models to promote yet.',
  'promotion.confirm': 'CONFIRM',

  // promotion channel labels (PromotionTierCard)
  'data.promoChannel.Press': 'Press',
  'data.promoChannel.Radio': 'Radio',
  'data.promoChannel.BillboardsAndStands': 'Billboards & stands',
  'data.promoChannel.TV': 'TV',
  'data.promoChannel.Internet': 'Internet',
  'data.promoChannel.Cinemas': 'Cinemas',
  'promotion.select': 'SELECT',
  'promotion.unlocksInYears': '{year} y.',

  // team creation (racing) screen
  'team.registration': 'TEAM REGISTRATION',
  'team.registerBlurb': 'Register your racing team and restore the garage to compete in events',
  'team.namePlaceholder': 'Enter team name',
  'team.locked': "Racing unlocks later in the company's history.",
  'team.registered': 'REGISTERED',
  'team.register': 'REGISTER',
  'team.unavailable': 'UNAVAILABLE',
  // Suggested team names for the 🎲 shuffle button - a starting point pre-filled into an editable
  // field, same "suggestion, not fixed data" status as CarDesignScreen's generateDefaultName. Once
  // accepted (registerTeam), the chosen name is persisted as plain free text - see
  // core/racing.ts's RacingState.teamName.
  'data.racingNamePool.0': 'Ironclad Racing',
  'data.racingNamePool.1': 'Silver Arrow Motorsport',
  'data.racingNamePool.2': 'Redline Syndicate',
  'data.racingNamePool.3': 'Vector Racing Team',
  'data.racingNamePool.4': 'Apex Dynamics',

  // research category tabs
  'data.researchCategory.Engine': 'Engine',
  'data.researchCategory.Bodies': 'Bodies',
  'data.researchCategory.Undercarriage': 'Undercarriage',
  'data.researchCategory.Appearance': 'Appearance',
  'data.researchCategory.Interior': 'Interior',
  'data.researchCategory.Safety': 'Safety',

  // research node card action-button state labels
  'research.state.Locked': 'LOCKED',
  'research.state.AvailableNormal': 'RESEARCH',
  'research.state.AvailableBreakthrough': 'BREAKTHROUGH',
  'research.state.InProgress': 'RESEARCHING…',
  'research.state.Researched': 'RESEARCHED',

  // model lineup screen (spec sheet)
  'modelLineup.noModels': 'No models designed yet.',
  'modelLineup.createRestyling': 'CREATE RESTYLING',
  'modelLineup.power': '{value} HP',
  'modelLineup.torque': '{value} NM @{rpm} RPM',
  'modelLineup.engineVolume': '{value} L',
  'modelLineup.fuelConsumption': '{value} L/100KM',
  'modelLineup.reliability': '{value} %',
  'modelLineup.emissions': '{value} G/KM',
  'modelLineup.weight': '{value} KG',
  'modelLineup.zeroToHundred': '{value} SEC',
  'modelLineup.labelPower': 'Power',
  'modelLineup.labelTorque': 'Torque',
  'modelLineup.labelEngineVolume': 'Engine Volume',
  'modelLineup.labelFuelConsumption': 'Fuel consumption',
  'modelLineup.labelReliability': 'Reliability',
  'modelLineup.labelEmissions': 'Emissions',
  'modelLineup.labelRepairCost': 'Repair cost',
  'modelLineup.labelWeight': 'Weight',
  'modelLineup.labelMaxRpm': 'Max RPM',
  'modelLineup.labelZeroToHundred': '0-100',
  'modelLineup.labelRating': 'Rating',
  'modelLineup.labelCarsSold': 'Cars sold',
  'modelLineup.labelEarnings': 'Earnings',
  'modelLineup.labelYearOfIssue': 'Year of issue',
  'modelLineup.labelCostPrice': 'Cost price',
  'modelLineup.labelPrice': 'Price',

  // sales statistics screen
  'salesStats.noModels': 'No models to report on yet.',
  'salesStats.advisorMessage': 'Boss! Here is the sales statistics of the current model',
  'salesStats.totalSold': '{sold} / {planned}',
  'salesStats.labelTotalSold': 'Total sold',
  'salesStats.labelLeftToSell': 'Models left to sell',
  'salesStats.labelSalesIncome': 'Sales income',
  'salesStats.labelEarnings': 'Earnings',
  'salesStats.labelMarketingDuration': 'Marketing duration',
  'salesStats.marketingInactive': '-',
  'salesStats.labelMarketingEfficiency': 'Marketing efficiency',
  'salesStats.efficiencyMultiplier': 'x{value}',
  'salesStats.efficiencyDefault': 'x1',
  'salesStats.dailySalesRate': '{value}%',
  'salesStats.withdraw': 'WITHDRAW FROM SALE',
  'salesStats.resume': 'RESUME SALE',
  'salesStats.launchMarketing': 'LAUNCH MARKETING',

  // body selection screen
  'bodySelection.equipmentCost': 'Production equipment cost: {cost}',
  'bodySelection.owned': 'Owned',
  'bodySelection.engineBay': '{value} L.',
  'bodySelection.notEnoughCash': "Not enough cash for this body's tooling.",

  // CarClass, used both as a body's own class label here and (generated suggestion only, never
  // retro-rewritten - see CarDesignScreen.tsx's generateDefaultName) as part of a default model
  // name.
  'data.carClass.Sedan': 'Sedan',
  'data.carClass.SUV': 'SUV',
  'data.carClass.Sports': 'Sports',
  'data.carClass.Coupe': 'Coupe',
  'data.carClass.Truck': 'Truck',

  // company screen
  'company.autoReleased': 'Auto released',
  'company.totalSold': 'Total sold',
  'company.marketShare': 'Market share',
  'company.earned': 'Earned',
  'company.rumors': 'RUMORS',
  'company.noRumors': 'No rumors yet.',

  // bankruptcy overlay
  'bankruptcy.title': 'Company Bankrupt',
  'bankruptcy.message':
    'The balance stayed too deep in debt for too long, and the company has run out of road. Time to start a new one.',
  'bankruptcy.startNewGame': '+ START NEW GAME',

  // tutorial card
  'tutorial.tapHighlighted': '👉 Tap the highlighted button',
  'tutorial.gotIt': 'Got it',

  // component slot card (design wizard option cyclers)
  'component.previousLabel': 'Previous {label}',
  'component.nextLabel': 'Next {label}',
  'component.unlocksIn': '🔒 {label} unlocks {year}',

  // classification tags (Class/Type picker) - label+description per tag. Note 'medium' here is a
  // DIFFERENT key/word than data.loanTier.medium.name or data.promoTier.medium.name even though
  // all three happen to be "Medium" in English - see en.ts's module doc on why that matters.
  'data.classification.budget.label': 'Budget',
  'data.classification.budget.description': 'Affordable car for everyday buyers.',
  'data.classification.medium.label': 'Medium',
  'data.classification.medium.description': 'Mid-priced car suitable for the city.',
  'data.classification.premium.label': 'Premium',
  'data.classification.premium.description': 'Business class car.',
  'data.classification.luxury.label': 'Luxury',
  'data.classification.luxury.description': 'Top-tier comfort and prestige.',
  'data.classification.off-road.label': 'Off-Road',
  'data.classification.off-road.description': 'Built to handle rough terrain.',
  'data.classification.sport.label': 'Sport',
  'data.classification.sport.description': 'Car with a sporty character.',
  'data.classification.track.label': 'Track',
  'data.classification.track.description': 'Purpose-built for the racetrack.',

  // classification picker chrome (not tag content itself, see data.classification.* above)
  'classificationPicker.class': 'Class',
  'classificationPicker.type': 'Type',
  'classificationPicker.pickClass': 'Pick a class',
  'classificationPicker.pickType': 'Pick a type',

  // car design wizard
  'carDesign.noDesignInProgress': 'No design in progress - go back and pick a body first.',
  'carDesign.backToOffice': '‹ BACK TO OFFICE',
  'carDesign.costPrice': 'Cost Price',
  'carDesign.safetyRatingTitle': 'SAFETY RATING',
  'carDesign.engineerAdvisor': 'Engineer',
  'carDesign.safetyFeedback.dangerous': 'This is dangerous. Stronger body materials and more airbags should be used.',
  'carDesign.safetyFeedback.decent': 'Decent, but buyers will expect more protection at this price point.',
  'carDesign.safetyFeedback.solid': 'Solid safety credentials - this should hold up well in reviews.',
  'carDesign.safetyFeedback.excellent': 'Excellent work. This is one of the safest designs on the lot.',
  'carDesign.reliability': '{value}%',
  'carDesign.meterPercent': '{value}%',
  'carDesign.modelName': 'Model name',
  'carDesign.comingSoon':
    '🚧 Sales Regions and Production Runs are coming in a future update - for now, this car goes straight on sale everywhere.',
  'carDesign.finish': '✓ FINISH',
  // generateDefaultName's suggestion pattern - see the trap this exists to avoid, documented on
  // CarDesignScreen.tsx's generateDefaultName and core/vehicles.ts's CarModel.name field.
  'carDesign.defaultNameFallback': 'Model',
  'carDesign.defaultNamePattern': '{carClass} {suffix}',

  // step breadcrumb/title overrides specific to this screen (STEP_META) - the remaining wizard
  // steps (Safety, Transmission, Undercarriage, Tires, Appearance, Interior, Aerodynamics) get
  // their breadcrumb/title from data/designSteps.ts instead, migrated separately in PR 3.
  'carDesign.step.classification.breadcrumb': 'Body Selection',
  'carDesign.step.classification.title': 'Car Classification',
  'carDesign.step.safetyRating.breadcrumb': 'Safety',
  'carDesign.step.safetyRating.title': 'Safety Rating',
  'carDesign.step.engine.breadcrumb': 'Safety Rating',
  'carDesign.step.engine.title': 'Engine',
  'carDesign.step.finish.breadcrumb': 'Aerodynamics',
  'carDesign.step.finish.title': 'Finish',
  'carDesign.step.pricing.breadcrumb': 'Finish',
  'carDesign.step.pricing.title': 'Pricing',

  'data.designStat.safety': 'Safety',
  'data.designStat.handling': 'Handling',
  'data.designStat.offroad': 'Offroad',
  'data.designStat.comfort': 'Comfort',
  'data.designStat.prestige': 'Prestige',
  'data.designStat.attractiveness': 'Attractiveness',

  // price slider (Pricing wizard step)
  'priceSlider.price': 'PRICE',
  'priceSlider.costPrice': 'COST PRICE',
  'priceSlider.earnings': 'Earnings {value}',

  // screen.<id>.title - the persistent top bar's title (see TopHud.tsx); a Record<ScreenId,
  // MessageKey> in useUiStore.ts maps every screen id to one of these.
  'screen.mainMenu.title': 'Main Menu',
  'screen.companyNaming.title': 'New Company',
  'screen.saveSlots.title': 'Save Slots',
  'screen.officeHub.title': 'Office',
  'screen.bodySelection.title': 'Body Selection',
  'screen.carDesign.title': 'Car Design',
  'screen.modelLineup.title': 'Model Lineup',
  'screen.salesStatistics.title': 'Sales Statistics',
  'screen.research.title': 'Research',
  'screen.employees.title': 'Employees',
  'screen.promotion.title': 'Promotion',
  'screen.company.title': 'Company',
  'screen.teamCreation.title': 'Team Creation',
  'screen.bank.title': 'Finance',

  'hud.inDebt': 'IN DEBT',

  // language screen
  'language.screenTitle': 'Language',
  'language.pseudoOption': 'Pseudo (dev)',

  // stats.* - pluralized, _one/_other sibling pairs (see plural() in ./t.ts). Seeded here ahead of
  // their PR 2 call sites (SalesStatisticsScreen) since they fix two live pluralization bugs
  // ("1 Days", "1 units today") that the migration is specifically meant to catch.
  'stats.marketingDaysRemaining_one': '{count} Day',
  'stats.marketingDaysRemaining_other': '{count} Days',
  'stats.unitsSoldToday_one': '{count} unit today',
  'stats.unitsSoldToday_other': '{count} units today',

  // news screen + headlines - see src/i18n/news.ts for the entry.type -> key mapping. Money/date
  // params arrive pre-formatted (fmt.compact()'d) by the caller, so these templates only ever
  // interpolate strings, never raw numbers needing their own locale formatting.
  'news.screenTitle': 'News',
  'news.empty': 'Nothing to report yet.',
  'news.modelReleased': '{modelName} enters production at {price}.',
  'news.modelSoldOut': '{modelName} has sold out its production run.',
  'news.researchCompleted': 'R&D completed: {tech}.',
  'news.loanTaken': 'Took out a loan of {principal}.',
  'news.loanPaidOff': 'Paid off a loan of {principal}.',
  'news.marketingCampaignStarted': 'Launched a marketing campaign for {modelName}.',
  'news.marketingCampaignEnded': 'The marketing campaign for {modelName} has ended.',
  'news.monthlyReport': 'Monthly report: {income} in, {expense} out.',
  'news.bankruptcyWarning': 'Warning: {days} days left before bankruptcy.',
  'news.racingTeamRegistered': '{teamName} has been registered for competition.',

  // rumor.* - src/i18n/rumors.ts assembles these into a RumorTemplateSet per locale. {person}/
  // {model} are NOT resolved by t() here - they're left as literal placeholders for
  // core/company.ts's own fill() to substitute later, same as the English source data always
  // worked (see data/rumorTemplates.ts). Advisor names are proper nouns and stay untranslated.
  'rumor.soldWell.0': "{person}'s opinion turned out to be decisive this time.",
  'rumor.soldWell.1': '{model} might set a new market trend.',
  'rumor.soldWell.2': "{person}'s opinion noticeably increased interest in {model}.",
  'rumor.struggled.0': "They say the market isn't ready to pay that much for {model}.",
  'rumor.struggled.1': 'Sales of {model} have been slower than expected this month.',
  'rumor.research.0': 'The engineers did a great job! The new tech looks very promising.',
  'rumor.research.1': 'The company is betting on reliability. It seems riskier technologies have been shelved.',

  // format - consumed by src/i18n/format.ts, never rendered as a whole message on their own
  'format.datePattern': '{day} {month} {year}',
  'format.percentPattern': '{value}%',
  'format.magnitude.K': 'K',
  'format.magnitude.M': 'M',
  'format.magnitude.B': 'B',

  'month.1.abbr': 'Jan.',
  'month.2.abbr': 'Feb.',
  'month.3.abbr': 'Mar.',
  'month.4.abbr': 'Apr.',
  'month.5.abbr': 'May',
  'month.6.abbr': 'Jun.',
  'month.7.abbr': 'Jul.',
  'month.8.abbr': 'Aug.',
  'month.9.abbr': 'Sep.',
  'month.10.abbr': 'Oct.',
  'month.11.abbr': 'Nov.',
  'month.12.abbr': 'Dec.',
} as const satisfies Record<string, string>
