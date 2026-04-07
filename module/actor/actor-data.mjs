// module/actor/actor-data.mjs

const { TypeDataModel } = foundry.abstract;
const { 
  SchemaField, 
  NumberField 
} = foundry.data.fields;

export class CRPActorData extends TypeDataModel {
  static defineSchema() {
    return {

      // ATRYBUTY + SKILLE
      attributes: new SchemaField({
        strength: new SchemaField({
          value: new NumberField({ initial: 3, min: 0 }),
          skills: new SchemaField({
            athletics: new SchemaField({ value: new NumberField({ initial: 0 }) }),
            twoHanded: new SchemaField({ value: new NumberField({ initial: 0 }) }),
            endurance: new SchemaField({ value: new NumberField({ initial: 0 }) }),
            brawl: new SchemaField({ value: new NumberField({ initial: 0 }) }),
            intimidate: new SchemaField({ value: new NumberField({ initial: 0 }) })
          })
        }),

        agility: new SchemaField({
          value: new NumberField({ initial: 3, min: 0 }),
          skills: new SchemaField({
            oneHanded: new SchemaField({ value: new NumberField({ initial: 0 }) }),
            lightWeapons: new SchemaField({ value: new NumberField({ initial: 0 }) }),
            craft: new SchemaField({ value: new NumberField({ initial: 0 }) }),
            shield: new SchemaField({ value: new NumberField({ initial: 0 }) }),
            stealth: new SchemaField({ value: new NumberField({ initial: 0 }) })
          })
        }),

        perception: new SchemaField({
          value: new NumberField({ initial: 3, min: 0 }),
          skills: new SchemaField({
            empathy: new SchemaField({ value: new NumberField({ initial: 0 }) }),
            disguise: new SchemaField({ value: new NumberField({ initial: 0 }) }),
            survival: new SchemaField({ value: new NumberField({ initial: 0 }) }),
            awareness: new SchemaField({ value: new NumberField({ initial: 0 }) }),
            ranged: new SchemaField({ value: new NumberField({ initial: 0 }) })
          })
        }),

        character: new SchemaField({
          value: new NumberField({ initial: 3, min: 0 }),
          skills: new SchemaField({
            charisma: new SchemaField({ value: new NumberField({ initial: 0 }) }),
            animals: new SchemaField({ value: new NumberField({ initial: 0 }) }),
            carousing: new SchemaField({ value: new NumberField({ initial: 0 }) }),
            gossip: new SchemaField({ value: new NumberField({ initial: 0 }) }),
            persuasion: new SchemaField({ value: new NumberField({ initial: 0 }) })
          })
        }),

        reason: new SchemaField({
          value: new NumberField({ initial: 3, min: 0 }),
          skills: new SchemaField({
            literacy: new SchemaField({ value: new NumberField({ initial: 0 }) }),
            languages: new SchemaField({ value: new NumberField({ initial: 0 }) }),
            medicine: new SchemaField({ value: new NumberField({ initial: 0 }) }),
            politics: new SchemaField({ value: new NumberField({ initial: 0 }) }),
            knowledge: new SchemaField({ value: new NumberField({ initial: 0 }) })
          })
        })
      }),

      // WSPÓŁCZYNNIKI POCHODNE
      derived: new SchemaField({
        initiative: new NumberField({ initial: 0 }),
        willpower: new NumberField({ initial: 0 }),

        health: new SchemaField({
          value: new NumberField({ initial: 0, min: 0 }),
          max: new NumberField({ initial: 0, min: 0 })
        }),

        maneuver: new NumberField({ initial: 0 })
      }),

      // ZASOBY
      resources: new SchemaField({
        fate: new SchemaField({
          value: new NumberField({ initial: 2, min: 0 })
        })
      })

    };
  }
}