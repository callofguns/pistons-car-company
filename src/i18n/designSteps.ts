import type { DesignStepDefinition, ComponentSlot } from '../data/designSteps'
import type { MessageKey } from './keys'
import type { useT } from './useT'

/** Resolves a generic wizard step's title/breadcrumb and every slot/option label+description
 * through the current locale, id-derived (data.designStep.<id>.*, data.designSlot.<id>.label,
 * data.designOption.<slotId>.<optionId>.*) rather than an explicit field on
 * DesignStepDefinition/ComponentSlot/ComponentOption - keeps those shared interfaces (also used
 * by CarDesignScreen's engine-preset slot, built fresh at render time, not from this table)
 * untouched. tests/dataKeys.test.ts walks the real DESIGN_STEPS table asserting every derived key
 * this function builds actually exists in en, which is what stands in for the compile-time safety
 * an explicit field would otherwise give up. */
export function translateDesignStep(step: DesignStepDefinition, t: ReturnType<typeof useT>['t']): DesignStepDefinition {
  return {
    ...step,
    title: t(`data.designStep.${step.id}.title` as MessageKey),
    breadcrumb: t(`data.designStep.${step.id}.breadcrumb` as MessageKey),
    slots: step.slots.map((slot) => translateSlot(slot, t)),
  }
}

function translateSlot(slot: ComponentSlot, t: ReturnType<typeof useT>['t']): ComponentSlot {
  return {
    ...slot,
    label: t(`data.designSlot.${slot.id}.label` as MessageKey),
    options: slot.options.map((option) => ({
      ...option,
      label: t(`data.designOption.${slot.id}.${option.id}.label` as MessageKey),
      description: option.description ? t(`data.designOption.${slot.id}.${option.id}.description` as MessageKey) : undefined,
    })),
  }
}
