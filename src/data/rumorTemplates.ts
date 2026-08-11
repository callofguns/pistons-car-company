import type { RumorTemplateSet } from '../core/company'

/** Same phrase bank as ContentGeneratorWindow's implicit RumorTemplateSet default (RumorTemplateSet.cs field initializers). */
export const RUMOR_TEMPLATES: RumorTemplateSet = {
  advisorNames: ['Dan Rich', 'Elena Cross', 'Marcus Wolfe', 'Priya Anand'],
  modelSoldWellTemplates: [
    "{person}'s opinion turned out to be decisive this time.",
    '{model} might set a new market trend.',
    "{person}'s opinion noticeably increased interest in {model}.",
  ],
  modelStruggledTemplates: [
    "They say the market isn't ready to pay that much for {model}.",
    'Sales of {model} have been slower than expected this month.',
  ],
  researchTemplates: [
    'The engineers did a great job! The new tech looks very promising.',
    'The company is betting on reliability. It seems riskier technologies have been shelved.',
  ],
}
