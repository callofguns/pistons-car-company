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
  'common.soundOn': 'Turn sound on',
  'common.soundOff': 'Turn sound off',
  'common.shop': 'Shop',
  'common.pause': 'Pause',
  'common.play': 'Play',
  'common.fastForward': 'Fast forward',
  'common.previous': 'Previous',
  'common.next': 'Next',
  'common.decrease': 'Decrease',
  'common.increase': 'Increase',
  'common.viewModelSales': 'View {modelName} sales',
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

  // save slots screen
  'saveSlots.overwriteHeading': 'CHOOSE A SLOT TO OVERWRITE',
  'saveSlots.everySlotFull': 'Every slot is full - pick one to start "{name}" in. This can\'t be undone.',
  'saveSlots.emptySlot': 'Empty Slot',
  'saveSlots.tapAgainToOverwrite': 'Tap again to overwrite',
  'saveSlots.newGame': '+ NEW GAME',
  'saveSlots.confirmDelete': 'Confirm delete {name}',
  'saveSlots.delete': 'Delete {name}',
  'saveSlots.oldVersion': 'Older version',
  'saveSlots.oldVersionHint': "Saved by an older version of the game - it can't be loaded. Delete it or start a new game here.",
  'saveSlots.oldSave': 'older save',
  'companyNaming.difficulty': 'Difficulty',
  'difficulty.easy': 'Easy',
  'difficulty.normal': 'Normal',
  'difficulty.hard': 'Hard',
  'difficulty.easy.description': 'More buyers, cheaper running costs, low interest.',
  'difficulty.normal.description': 'The intended challenge.',
  'difficulty.hard.description': 'Fewer buyers, pricier running costs, steep interest.',

  // nav.* - Office Hub's nav cluster specifically (title case, no CSS text-transform there - see
  // OfficeHubScreen.tsx). Main Menu's SAVES/NEWS/LANGUAGE are a separate menu.* domain below: same
  // words, but ALL CAPS there (MainMenuScreen.module.css's .buttons has no text-transform either,
  // so the casing has to be literal) - keeping them as distinct keys is exactly the
  // Small/Medium/Large lesson from data.loanTier vs data.classification, applied to nav labels.
  'nav.research': 'Research',
  'nav.promotion': 'Promotion',
  'nav.models': 'Models',
  'nav.racing': 'Racing',
  'nav.staff': 'Staff',
  'nav.company': 'Company',
  'nav.news': 'News',
  'nav.factory': 'Factory',
  'nav.rivals': 'Rivals',
  'factory.lines': 'Lines {count}/{max}',
  'factory.stock': '{count} cars in stock',
  'factory.monthlyCosts': 'Upkeep {upkeep} · storage {storage} / month',
  'factory.line': 'Line {number}',
  'factory.levelCapacity': 'Level {level} · {cars} cars/day',
  'factory.idle': 'Idle',
  'factory.idleHint': 'Pick a model to build with the arrows.',
  'factory.developingHint': 'Still in development - building starts when it is ready.',
  'factory.onOrder': '{count} on order',
  'factory.daysLeft': '~{days} days',
  'factory.noOrder': 'Nothing on order - add cars below.',
  'factory.clear': 'Clear',
  'factory.upgrade': 'Upgrade: {cars}/day · {cost}',
  'factory.maxLevel': 'Max level',
  'factory.newLine': 'New production line',
  'factory.newLineCost': 'Build for {cost}',
  'factory.lineLimit': 'Your HQ has room for {max} line(s) - upgrade it on the Company screen for more.',
  'factory.notEnoughCash': 'Not enough cash.',
  'factory.previousModel': 'Previous model',
  'factory.nextModel': 'Next model',
  'factory.addCars': 'Add {count} cars to the order',
  'screen.factory.title': 'Factory',
  'screen.rivals.title': 'Rivals',
  'rivals.ranking': 'Market share',
  'rivals.rankingNote': 'Share of all new cars sold, by maker. Better, fresher, fairly priced cars take share from rivals.',
  'rivals.style.Budget': 'Budget',
  'rivals.style.Luxury': 'Luxury',
  'rivals.style.Sports': 'Sports',
  'rivals.city': 'Based in {city}',
  'rivals.newest': 'Newest model: {model} ({year})',
  'rivals.sold': 'Cars sold: {count}',
  'rivals.strength': 'Strength',
  'rivals.newModelBoost': 'New model!',
  'rivals.yourSold': 'Your company has sold {count} cars so far.',

  // office hub
  'officeHub.sales': 'SALES',
  'officeHub.noModels': 'No models yet - design your first car.',
  'officeHub.createCar': 'Create car',
  'officeHub.soldToday': 'today',

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
  'data.transactionCategory.HQUpgrade': 'HQ upgrade',
  'data.transactionCategory.Production': 'Building cars',
  'data.transactionCategory.Factory': 'Factory lines',
  'data.transactionCategory.Storage': 'Car storage',
  'data.transactionCategory.Research': 'Research',
  'data.transactionCategory.Marketing': 'Marketing',
  'data.transactionCategory.Racing': 'Racing',
  'data.transactionCategory.LoanPrincipal': 'Loan principal',
  'data.transactionCategory.LoanInterest': 'Loan interest',
  'data.transactionCategory.OverdraftInterest': 'Overdraft interest',
  'data.transactionCategory.Other': 'Other',

  // employees screen - roster (left) + applicant pool (right), see EmployeesScreen.tsx
  'employees.perMonth': '{amount} / month',
  'employees.roster': 'Roster ({count}/{cap})',
  'employees.wageBill': 'Monthly wage bill',
  'employees.prodSpeed': 'Production speed',
  'employees.researchBonus': 'Research bonus',
  'employees.prodQuality': 'Production quality',
  'employees.marketingDiscount': 'Marketing discount',
  'employees.unitCostReduction': 'Unit cost reduction',
  'employees.noEmployees': 'No one hired yet - pick a candidate from the applicant pool.',
  'employees.fire': 'FIRE',
  'employees.applicants': 'Applicants',
  'employees.atCap': 'Roster is full - upgrade the HQ for more slots.',
  'employees.noApplicants': 'No applicants right now - check back next month.',
  'employees.hire': 'HIRE',

  // employee roles (EmployeeRow) - id-derived-style key set, not a MessageKey field on Employee
  // itself (Employee.role stays a plain string union for save-data simplicity)
  'data.employeeRole.Engineer': 'Engineer',
  'data.employeeRole.Assembler': 'Assembler',
  'data.employeeRole.Designer': 'Designer',
  'data.employeeRole.Marketer': 'Marketer',
  'data.employeeRole.Logistician': 'Logistician',

  // employee perks (EmployeeRow's chip + tooltip) - id-derived key set, see
  // tests/dataKeys.test.ts for the walking-test that stands in for compile-time safety here.
  'data.employeePerk.negotiator.name': 'Negotiator',
  'data.employeePerk.negotiator.description': 'Haggles down media rates - extra marketing discount.',
  'data.employeePerk.prodigy.name': 'Prodigy',
  'data.employeePerk.prodigy.description': 'Learns twice as fast as anyone else on the team.',
  'data.employeePerk.mentor.name': 'Mentor',
  'data.employeePerk.mentor.description': 'Sets the pace for the department - stronger output.',
  'data.employeePerk.perfectionist.name': 'Perfectionist',
  'data.employeePerk.perfectionist.description': 'Meticulous work - stronger output, slower to level up.',
  'data.employeePerk.efficient.name': 'Efficient',
  'data.employeePerk.efficient.description': 'Cuts waste - extra unit cost reduction.',
  'data.employeePerk.veteran.name': 'Veteran',
  'data.employeePerk.veteran.description': 'Years on the job - noticeably stronger output.',

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
  'promotion.unlocksInYears': 'Unlocks in {year}',

  // team creation (racing) screen
  'team.randomName': 'Random team name',
  'team.registration': 'TEAM REGISTRATION',
  'team.registerBlurb': 'Register your racing team and restore the garage to compete in events',
  'team.namePlaceholder': 'Enter team name',
  'team.locked': "Racing unlocks later in the company's history.",
  'team.registered': 'REGISTERED',
  'team.register': 'REGISTER',
  'team.unavailable': 'UNAVAILABLE',
  'team.pendingEntry': 'Entered {tier} with {model}. Results at the end of the month.',
  'team.enterRace': 'ENTER A RACE',
  'team.recentResults': 'Recent Results',
  'team.noResultsYet': 'No races run yet.',
  'team.resultRow': '{tier} - {position}/{fieldSize}',
  'team.resultPrize': '+{prize}',
  'team.resultNoPrize': 'No prize',

  // race entry screen (ENTER A RACE) - mirrors promotion.* above structurally
  'race.selectTier': 'Select a Race',
  'race.noModels': 'No models to enter yet.',
  'race.confirm': 'ENTER',
  'race.notEnoughCash': "Not enough cash for this race's entry fee.",
  'race.entryFee': 'Entry fee',
  'race.firstPrize': '1st prize',
  'race.fieldSize': 'Field size',
  'race.favorsType': 'Favors {type}',

  // race tiers (ENTER A RACE screen) - id-derived key set (data.raceTier.<id>.name), see
  // tests/dataKeys.test.ts for the walking-test that stands in for compile-time safety here.
  'data.raceTier.local-circuit.name': 'Local Circuit',
  'data.raceTier.regional-rally.name': 'Regional Rally',
  'data.raceTier.national-grand-prix.name': 'National Grand Prix',
  'data.raceTier.international-endurance.name': 'International Endurance',

  // HQ levels (Company screen's HQ panel) - id-derived key set (data.hqLevel.<level>.name), see
  // tests/dataKeys.test.ts for the walking-test that stands in for compile-time safety here.
  'data.hqLevel.1.name': 'Garage',
  'data.hqLevel.2.name': 'Workshop',
  'data.hqLevel.3.name': 'Factory',
  'data.hqLevel.4.name': 'Industrial Park',
  'data.hqLevel.5.name': 'Global HQ',

  // race news headlines - two variants (with/without prize) so a non-podium finish doesn't read
  // as "won $0"; see src/i18n/news.ts's RaceCompleted case.
  'news.raceCompletedWithPrize': '{modelName} finished {position}/{fieldSize} in the {tier} - {prize} prize.',
  'news.raceCompletedNoPrize': '{modelName} finished {position}/{fieldSize} in the {tier}.',

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
  'research.state.Locked': 'UNAVAILABLE',
  'research.state.TooEarly': 'FROM {year}',
  'research.unlocks.part': 'Unlocks this part in the car designer.',
  'research.unlocks.engine': 'Unlocks this engine in the car designer.',
  'research.unlocks.body': 'Unlocks this body for new cars.',
  'research.needsPrevious': 'Research the previous card first.',
  'research.state.AvailableNormal': 'RESEARCH',
  'research.state.AvailableBreakthrough': 'BREAKTHROUGH',
  'research.state.InProgress': 'RESEARCHING…',
  'research.state.Researched': 'RESEARCHED',
  'research.info': 'What does {name} do?',
  'research.earlyWarning': 'Not due until {year} - researching it now is a breakthrough: the earlier, the pricier.',
  'research.effect.Power': '{amount} power',
  'research.effect.Reliability': '{amount} reliability',
  'research.effect.FuelEconomy': '{amount} fuel economy',
  'research.effect.Emissions': '{amount} emissions',
  'research.effect.ProductionCost': '{amount} production cost',
  'research.effect.RepairCost': '{amount} repair cost',
  'research.duration': '{days} days',
  'research.pointsActive': 'Earning {points} research points a day while {count} car(s) develop.',
  'research.pointsIdle': 'No research points coming in - you only earn them while a car is in development. Design a new car to start.',
  'development.inDevelopment': 'In development',
  'development.daysLeft': 'In development - {days} days left',
  'development.daysShort': 'Developing · {days}d',
  'officeHub.noStock': 'No stock - order at Factory',

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
  'salesStats.advisorOld': 'This design is getting old, so it sells less every year. Create a restyling on the Models screen to make it fresh again.',
  'salesStats.labelFreshness': 'Freshness',
  'salesStats.freshnessValue': '{percent}% · {years} yrs old',
  'salesStats.labelTotalSold': 'Total sold',
  'salesStats.labelInStock': 'In stock',
  'salesStats.labelOnOrder': 'On order at the Factory',
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
  'bodySelection.equipmentCostLabel': 'Production equipment cost',
  'bodySelection.alreadyTooled': 'Already tooled - no cost',
  'bodySelection.bodyCapacity': 'Body capacity',
  'bodySelection.unlocksIn': 'Research it in R&D to unlock (due {year})',
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
  'company.hqTitle': 'Headquarters',
  'company.hqLevel': 'Level',
  'company.hqSlots': 'Staff slots',
  'company.hqOverhead': 'Overhead',
  'company.hqNextLevel': 'Next: {name} ({slots} slots) - {cost}',
  'company.hqNotEnoughCash': 'Not enough cash for this upgrade.',
  'company.hqUpgrade': 'UPGRADE',
  'company.hqMaxLevel': 'Maximum HQ level reached.',

  // bankruptcy overlay
  'bankruptcy.title': 'Company Bankrupt',
  'bankruptcy.message':
    'The balance stayed too deep in debt for too long, and the company has run out of road. Time to start a new one.',
  'bankruptcy.startNewGame': '+ START NEW GAME',

  // tutorial card
  'tutorial.tapHighlighted': 'Tap the highlighted button',
  'tutorial.gotIt': 'Got it',

  // component slot card (design wizard option cyclers)
  'component.previousLabel': 'Previous {label}',
  'component.nextLabel': 'Next {label}',
  'component.unlocksIn': 'Research {label} in R&D to unlock it.',
  'component.info': 'About {label}',
  'carDesign.specifications': 'Specifications',
  'carDesign.previousStep': 'Previous step',
  'carDesign.nextStep': 'Next step',
  'carDesign.parts': 'Parts',
  'carDesign.topSpeed': 'Top speed',
  'specs.torque': '{value} NM',
  'specs.peakTorqueAt': 'Peak torque at',
  'specs.rpm': '{value} RPM',
  'specs.fuelUse': 'Fuel use',
  'carDesign.designFit': 'Design fit',
  'carDesign.kmh': '{value} km/h',

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
  'carDesign.backToOffice': 'Back to office',
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
    'After development finishes, order cars from a production line on the Factory screen - only cars you order get built.',
  'carDesign.finish': '✓ FINISH',
  'carDesign.stepOf': 'Step {step} of {total}',
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

  // loan tiers (Finance screen) - 'medium' here is a different key/word than
  // data.promoTier.medium.name or data.classification.medium.label.
  'data.loanTier.small.name': 'Small',
  'data.loanTier.medium.name': 'Medium',
  'data.loanTier.large.name': 'Large',

  // promotion tiers - likewise a different key/word than the two above despite sharing English text.
  'data.promoTier.basic.name': 'Basic',
  'data.promoTier.medium.name': 'Medium',
  'data.promoTier.large.name': 'Large',

  // body styles - id-derived keys (data.body.<id>.name), not an explicit interface field, so
  // adding this didn't touch BodyStyleDefinition or the 4 test files that build fixture literals
  // of it (save.test.ts, market.test.ts, vehicleService.test.ts, carSpecsCalculator.test.ts).
  // Compile-time safety is instead a vitest walk (tests/dataKeys.test.ts) asserting every derived
  // key exists in en - same tradeoff the plan calls out for researchNodes/designSteps below.
  // displayName stays the English fallback/id-derivation source, never itself shown once
  // BodySelectionScreen resolves through this key.
  'data.body.classic-saloon.name': 'Classic Saloon',
  'data.body.executive-sedan.name': 'Executive Sedan',
  'data.body.trail-suv.name': 'Trail SUV',
  'data.body.grand-suv.name': 'Grand SUV',
  'data.body.roadster.name': 'Roadster',
  'data.body.gt-coupe.name': 'GT Coupe',
  'data.body.compact-coupe.name': 'Compact Coupe',
  'data.body.pickup.name': 'Pickup',

  // engine presets - id-derived, same pattern as data.body.* above. Displacement is baked into the
  // name (matching spec.displacementLiters) rather than composed at render time, same call as the
  // body names - keep the number correct if translating.
  'data.enginePreset.economy-i3.name': 'Economy I3 1.0L',
  'data.enginePreset.standard-i4.name': 'Standard I4 1.6L',
  'data.enginePreset.diesel-i4.name': 'Diesel I4 2.2L',
  'data.enginePreset.performance-v6.name': 'Performance V6 3.0L',
  'data.enginePreset.muscle-v8.name': 'Muscle V8 5.0L',
  'data.enginePreset.sport-turbo-i4.name': 'Sport Turbo I4 2.0L',
  'data.enginePreset.rally-turbo-i4.name': 'Rally Turbo I4 2.2L',
  'data.enginePreset.electric-drive.name': 'Electric Drive Unit',

  // research nodes - id-derived (data.research.<id>.name), same pattern as data.body.*, BUT with
  // one hard constraint worth restating: the id itself (researchNodes.ts's slug(category) +
  // slug(name)) is persisted in saves as ResearchNodeSaveEntry.nodeId. The English `name` in
  // researchNodes.ts that derives it must never change once shipped - a translator "fixing" that
  // source array would silently invalidate every existing save's research progress. Only these
  // *.name catalog values (the display text) are meant to be translated; tests/dataKeys.test.ts
  // pins the full id list against a hardcoded array specifically to catch that mistake.
  'data.research.engine-engine-material.name': 'Engine Material',
  'data.research.engine-cylinder-head-material.name': 'Cylinder Head Material',
  'data.research.engine-pistons.name': 'Pistons',
  'data.research.engine-crankshaft.name': 'Crankshaft',
  'data.research.engine-fuel-system.name': 'Fuel System',
  'data.research.engine-catalytic-converter.name': 'Catalytic Converter',
  'data.research.engine-exhaust-gas-recirculation.name': 'Exhaust Gas Recirculation',
  'data.research.engine-direct-injection.name': 'Direct Injection',
  'data.research.bodies-aerodynamic-shell.name': 'Aerodynamic Shell',
  'data.research.bodies-lightweight-chassis.name': 'Lightweight Chassis',
  'data.research.bodies-reinforced-frame.name': 'Reinforced Frame',
  'data.research.bodies-modular-platform.name': 'Modular Platform',
  'data.research.undercarriage-suspension-tuning.name': 'Suspension Tuning',
  'data.research.undercarriage-independent-rear-suspension.name': 'Independent Rear Suspension',
  'data.research.undercarriage-anti-roll-bars.name': 'Anti-Roll Bars',
  'data.research.safety-seatbelt-pretensioners.name': 'Seatbelt Pretensioners',
  'data.research.safety-abs-braking.name': 'ABS Braking',
  'data.research.safety-stability-control.name': 'Stability Control',

  // design wizard steps/slots/options - id-derived (data.designStep.<id>.*, data.designSlot.<id>.
  // label, data.designOption.<slotId>.<optionId>.*), same pattern as data.body.* above. Slot ids
  // are unique across every step; option ids are NOT (e.g. 'standard'/'steel' repeat across
  // unrelated slots), which is exactly why option keys are namespaced under their slot id -
  // tests/dataKeys.test.ts walks the full DESIGN_STEPS table asserting every derived key exists.
  'data.designStep.Safety.title': 'Safety',
  'data.designStep.Safety.breadcrumb': 'Car classification',
  'data.designStep.Transmission.title': 'Transmission',
  'data.designStep.Transmission.breadcrumb': 'Engine',
  'data.designStep.Undercarriage.title': 'Undercarriage',
  'data.designStep.Undercarriage.breadcrumb': 'Transmission',
  'data.designStep.Tires.title': 'Tires',
  'data.designStep.Tires.breadcrumb': 'Undercarriage',
  'data.designStep.Appearance.title': 'Appearance',
  'data.designStep.Appearance.breadcrumb': 'Tires',
  'data.designStep.Interior.title': 'Interior',
  'data.designStep.Interior.breadcrumb': 'Appearance',
  'data.designStep.Aerodynamics.title': 'Aerodynamics',
  'data.designStep.Aerodynamics.breadcrumb': 'Interior',

  'data.designSlot.body-material.label': 'Body Material',
  'data.designOption.body-material.steel.label': 'Steel',
  'data.designOption.body-material.steel.description': 'Cheap and simple.',
  'data.designOption.body-material.aluminum.label': 'Aluminum',
  'data.designOption.body-material.aluminum.description': 'Lighter, more expensive.',
  'data.designOption.body-material.high-strength-steel.label': 'High-Strength Steel',
  'data.designOption.body-material.high-strength-steel.description': 'Better crash protection.',
  'data.designOption.body-material.composite.label': 'Composite Panels',
  'data.designOption.body-material.composite.description': 'Strong and light.',
  'data.designOption.body-material.carbon-fiber.label': 'Carbon Fiber',
  'data.designOption.body-material.carbon-fiber.description': 'Best-in-class, very costly.',

  'data.designSlot.airbags.label': 'Airbags',
  'data.designOption.airbags.none.label': 'None',
  'data.designOption.airbags.driver.label': 'Driver Airbag',
  'data.designOption.airbags.dual-front.label': 'Dual Front Airbags',
  'data.designOption.airbags.full-curtain.label': 'Full Curtain Airbags',

  'data.designSlot.passive-safety.label': 'Passive Safety',
  'data.designOption.passive-safety.none.label': 'None',
  'data.designOption.passive-safety.crumple-zones.label': 'Crumple Zones',
  'data.designOption.passive-safety.reinforced-cage.label': 'Reinforced Cage',
  'data.designOption.passive-safety.advanced-structure.label': 'Advanced Structure',

  'data.designSlot.gearbox-type.label': 'Gearbox',
  'data.designOption.gearbox-type.manual.label': 'Manual',
  'data.designOption.gearbox-type.automatic.label': 'Automatic',
  'data.designOption.gearbox-type.dual-clutch.label': 'Dual-Clutch',

  'data.designSlot.drive-type.label': 'Drive Type',
  'data.designOption.drive-type.fwd.label': 'Front-Wheel Drive',
  'data.designOption.drive-type.rwd.label': 'Rear-Wheel Drive',
  'data.designOption.drive-type.awd.label': 'All-Wheel Drive',

  'data.designSlot.suspension.label': 'Suspension',
  'data.designOption.suspension.standard.label': 'Standard',
  'data.designOption.suspension.sport.label': 'Sport',
  'data.designOption.suspension.off-road.label': 'Off-Road',
  'data.designOption.suspension.adaptive.label': 'Adaptive',

  'data.designSlot.brakes.label': 'Brakes',
  'data.designOption.brakes.drum.label': 'Drum',
  'data.designOption.brakes.disc-front.label': 'Front Disc',
  'data.designOption.brakes.disc-all-round.label': 'All-Round Disc',
  'data.designOption.brakes.performance.label': 'Performance',

  'data.designSlot.tire-supplier.label': 'Tire Supplier',
  'data.designOption.tire-supplier.pireri.label': 'Pireri',
  'data.designOption.tire-supplier.pireri.description': 'Excellent handling and grip; weak offroad, pricey.',
  'data.designOption.tire-supplier.michelin.label': 'Michelin',
  'data.designOption.tire-supplier.michelin.description': 'Good handling and grip; weak offroad.',
  'data.designOption.tire-supplier.ridgestones.label': 'Ridgestones',
  'data.designOption.tire-supplier.ridgestones.description': 'Great offroad; weak handling and grip.',
  'data.designOption.tire-supplier.yoody-gear.label': 'Yoody Gear',
  'data.designOption.tire-supplier.yoody-gear.description': 'Good handling and price; weak offroad and grip.',

  'data.designSlot.paint-finish.label': 'Paint Finish',
  'data.designOption.paint-finish.standard.label': 'Standard',
  'data.designOption.paint-finish.metallic.label': 'Metallic',
  'data.designOption.paint-finish.pearlescent.label': 'Pearlescent',
  'data.designOption.paint-finish.matte.label': 'Matte',

  'data.designSlot.wheel-style.label': 'Wheels',
  'data.designOption.wheel-style.steel.label': 'Steel',
  'data.designOption.wheel-style.alloy.label': 'Alloy',
  'data.designOption.wheel-style.sport-alloy.label': 'Sport Alloy',
  'data.designOption.wheel-style.custom-forged.label': 'Custom Forged',

  'data.designSlot.interior-material.label': 'Interior Material',
  'data.designOption.interior-material.basic-vinyl.label': 'Basic Vinyl',
  'data.designOption.interior-material.fabric.label': 'Fabric',
  'data.designOption.interior-material.leatherette.label': 'Leatherette',
  'data.designOption.interior-material.leather.label': 'Leather',
  'data.designOption.interior-material.premium-leather.label': 'Premium Leather',

  'data.designSlot.features.label': 'Features',
  'data.designOption.features.basic.label': 'Basic',
  'data.designOption.features.climate-control.label': 'Climate Control',
  'data.designOption.features.premium-audio.label': 'Premium Audio',
  'data.designOption.features.full-luxury-suite.label': 'Full Luxury Suite',

  'data.designSlot.aero-package.label': 'Aero Package',
  'data.designOption.aero-package.standard.label': 'Standard',
  'data.designOption.aero-package.sport-kit.label': 'Sport Kit',
  'data.designOption.aero-package.track-kit.label': 'Track Kit',

  // engine preset spec-line description ("3.0L 6-cyl Turbo Petrol") - composed from EngineSpec at
  // render time, not stored as a fixed string in enginePresets.ts.
  'carDesign.engineSpecDescription': '{liters}L {cylinders}-cyl {fuelType}',
  'carDesign.turbo': 'Turbo',
  'data.fuelType.Petrol': 'Petrol',
  'data.fuelType.Diesel': 'Diesel',
  'data.fuelType.Electric': 'Electric',

  // tutorial script (PR 4) - explicit titleKey/messageKey fields on TutorialStep (small table, 13
  // entries, no test fixtures construct this type - see data/tutorialSteps.ts). Messages that
  // reference a highlighted button's own text (e.g. "CREATE CAR") bake in that button's
  // translated wording directly, same maintenance relationship the English original already had
  // between this file and the screens - not solved by this migration, not made worse by it either.
  'tutorial.officeWelcome.title': 'Welcome to Pistons',
  'tutorial.officeWelcome.message':
    "I'll show you around, then help you design your first car. The Office is home base - you'll return here between every decision.",
  'tutorial.officeSales.title': 'Sales panel',
  'tutorial.officeSales.message':
    "The SALES panel on the right tracks your top-selling models and how many sold today. It's empty for now - that changes once you've got a car on the lot.",
  'tutorial.officeNav.title': 'Getting around',
  'tutorial.officeNav.message':
    'The icon buttons along the bottom, from left: Research (flask) unlocks new parts, Promotion (megaphone) runs ad campaigns, Models (car) reviews everything you sell, Racing (flag) is a later-game team, Staff (person) manages your workforce, Company (building) shows your HQ, and News (newspaper) has the latest headlines.',
  'tutorial.officeHud.title': 'The top bar',
  'tutorial.officeHud.message':
    'Reputation, people who know your company, the date, cash and research points - always visible. The small pause/play/fast buttons under the year control time itself: sales and bills only happen while it runs. The gold cart opens Finance.',
  'tutorial.officeCreateCar.title': 'Time to build',
  'tutorial.officeCreateCar.message': 'Tap the highlighted CREATE CAR button to start designing your first vehicle.',
  'tutorial.bodySelection.title': 'Choose a body',
  'tutorial.bodySelection.message':
    'Swipe through the available bodies with the arrows. Each has its own class, engine bay size, and a one-time production tooling cost the first time you use it.',
  'tutorial.bodyContinue.title': 'Lock it in',
  'tutorial.bodyContinue.message': 'Happy with one? Tap the highlighted ✓ CONTINUE button to start designing it.',
  'tutorial.wizardClassification.title': 'Classification',
  'tutorial.wizardClassification.message':
    'Pick one Class (Budget through Luxury) and one Type (Off-Road, Sport, or Track) - together they decide which buyers your car appeals to. Then tap the highlighted CONTINUE button.',
  'tutorial.wizardSafety.title': 'Component steps',
  'tutorial.wizardSafety.message':
    'Every part step works the same way: pricier parts cost more but improve your stats. This one is Safety - the rest of the wizard (Transmission, Tires, Interior, and so on) follows the same pattern.',
  'tutorial.wizardSafetyRating.title': 'Safety rating',
  'tutorial.wizardSafetyRating.message': 'Your star rating from the parts you just picked. More stars means safer cars and happier buyers.',
  'tutorial.wizardEngine.title': 'Engine',
  'tutorial.wizardEngine.message':
    'Pick an engine preset and watch the spec sheet - Power, Torque, Fuel Consumption, Reliability, and Weight all shape how this car sells.',
  'tutorial.wizardFinish.title': 'Name it',
  'tutorial.wizardFinish.message': 'Give your car a name (or keep the one I generated for you), then tap the highlighted CONTINUE button.',
  'tutorial.wizardPricing.title': 'Set a price',
  'tutorial.wizardPricing.message':
    'Price above your Cost Price to turn a profit. The suggested price balances margin against what buyers in your segment expect - then tap the highlighted ✓ FINISH button to put it into production.',
  'tutorial.lineupFinale.title': "You're on the lot",
  'tutorial.lineupFinale.message':
    'Your first car is now in development. While it develops you earn research points - spend them in Research. Head back to the Office to let time run.',
  'tutorial.officeWait.title': 'Your car is being developed',
  'tutorial.officeWait.message':
    'Press play (or fast forward) under the year to let time run. Development takes a few weeks, and you earn research points while you wait. A news item will tell you when the car is ready.',
  'tutorial.officeFactory.title': 'Your car is ready',
  'tutorial.officeFactory.message':
    'Nothing sells until you build cars. Tap the highlighted Factory button to order your first batch.',
  'tutorial.factoryOrder.title': 'Order cars',
  'tutorial.factoryOrder.message':
    'Your production line builds the cars you order, a few every day. Tap the highlighted +500 button to order 500 cars. Unsold cars cost storage money, so do not order too many.',
  'tutorial.factoryDone.title': 'Now sell them',
  'tutorial.factoryDone.message':
    'Go back to the Office and press play. Cars appear in stock as they are built, then sell, and the money shows in the Sales panel. If cars run out, order more. If sales are slow, lower the price or launch marketing.',

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
  'screen.raceEntry.title': 'Enter a Race',
  'screen.bank.title': 'Finance',

  'hud.inDebt': 'IN DEBT',
  'hud.reputation': 'Reputation',
  'hud.reach': 'People who know your company',
  'hud.day': 'Day',
  'hud.month': 'Month',
  'hud.year': 'Year',
  'hud.cash': 'Cash',
  'hud.researchPoints': 'Research points',


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
  'news.modelDevelopmentStarted': '{modelName} is now in development - ready in {days} days. Research points come in while it develops.',
  'news.modelReleased': '{modelName} finished development and is ready at {price} - order cars at the Factory.',
  'news.modelSoldOut': '{modelName} is out of stock with nothing on order - order more at the Factory.',
  'news.researchCompleted': 'R&D completed: {tech}.',
  'news.loanTaken': 'Took out a loan of {principal}.',
  'news.loanPaidOff': 'Paid off a loan of {principal}.',
  'news.marketingCampaignStarted': 'Launched a marketing campaign for {modelName}.',
  'news.marketingCampaignEnded': 'The marketing campaign for {modelName} has ended.',
  'news.monthlyReport': 'Monthly report: {income} in, {expense} out.',
  'news.bankruptcyWarning': 'Warning: {days} days left before bankruptcy.',
  'news.racingTeamRegistered': '{teamName} has been registered for competition.',
  'news.hqUpgraded': 'Headquarters upgraded to {level}.',
  'news.historyEventStarted': '{name}: {description}',
  'news.rivalLaunch': '{rival} launches the {model}. Expect tougher competition for a while.',
  'news.historyEventEnded': '{name} is over - the market is back to normal.',
  'news.activeEvents': 'Happening now',
  // history events - id-derived (data.historyEvent.<id>.*), see data/historyEvents.ts
  'data.historyEvent.oil-crisis-1973.name': '1973 Oil Crisis',
  'data.historyEvent.oil-crisis-1973.description': 'Petrol is scarce: fewer cars sell and buyers want fuel-efficient ones, not power.',
  'data.historyEvent.clean-air-1975.name': 'Clean Air Act',
  'data.historyEvent.clean-air-1975.description': 'Cars over 650 g/km of CO2 now sell 40% less.',
  'data.historyEvent.cafe-1978.name': 'Fuel Economy Standards',
  'data.historyEvent.cafe-1978.description': 'Buyers care a little more about fuel economy from now on.',
  'data.historyEvent.oil-crisis-1979.name': '1979 Oil Crisis',
  'data.historyEvent.oil-crisis-1979.description': 'Oil prices double: fewer cars sell and fuel economy matters most.',
  'data.historyEvent.recession-1980.name': 'Early-80s Recession',
  'data.historyEvent.recession-1980.description': 'Fewer cars sell and building them costs 10% more.',
  'data.historyEvent.oil-glut-1986.name': 'Oil Glut',
  'data.historyEvent.oil-glut-1986.description': 'Cheap petrol: more cars sell and buyers want power again.',
  'data.historyEvent.gulf-war-1990.name': 'Gulf War Oil Shock',
  'data.historyEvent.gulf-war-1990.description': 'Fewer cars sell and fuel economy matters more.',
  'data.historyEvent.euro-1-1993.name': 'Euro 1 Emission Limits',
  'data.historyEvent.euro-1-1993.description': 'Cars over 450 g/km of CO2 now sell 30% less.',
  'data.historyEvent.suv-boom-1995.name': 'SUV Boom',
  'data.historyEvent.suv-boom-1995.description': 'SUVs sell 50% more and pickups 25% more.',
  'data.historyEvent.airbag-law-1998.name': 'Airbag Law',
  'data.historyEvent.airbag-law-1998.description': 'Cars without airbags now sell 60% less.',
  'data.historyEvent.recession-2001.name': 'Dot-com Bust',
  'data.historyEvent.recession-2001.description': 'A short dip: slightly fewer cars sell.',
  'data.historyEvent.oil-spike-2007.name': 'Record Oil Prices',
  'data.historyEvent.oil-spike-2007.description': 'Fuel economy matters more and power matters less.',
  'data.historyEvent.great-recession-2008.name': 'Great Recession',
  'data.historyEvent.great-recession-2008.description': 'The worst car market in decades: a third fewer cars sell.',
  'data.historyEvent.euro-5-2009.name': 'Euro 5 Emission Limits',
  'data.historyEvent.euro-5-2009.description': 'Cars over 350 g/km of CO2 now sell 30% less.',
  'data.historyEvent.scrappage-2009.name': 'Cash for Clunkers',
  'data.historyEvent.scrappage-2009.description': 'Scrappage payments: a short buying spree for thrifty cars.',
  'data.historyEvent.ev-interest-2012.name': 'Electric Car Interest',
  'data.historyEvent.ev-interest-2012.description': 'Electric cars now sell 40% more.',
  'data.historyEvent.dieselgate-2015.name': 'Dieselgate',
  'data.historyEvent.dieselgate-2015.description': 'Diesel cars now sell 35% less.',
  'data.historyEvent.pandemic-2020.name': 'COVID-19 Pandemic',
  'data.historyEvent.pandemic-2020.description': 'Showrooms and factories close: half the sales and half the production.',
  'data.historyEvent.chip-shortage-2021.name': 'Chip Shortage',
  'data.historyEvent.chip-shortage-2021.description': 'Factories build 40% fewer cars and each costs 15% more.',

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
