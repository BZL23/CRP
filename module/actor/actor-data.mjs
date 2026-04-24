// module/actor/actor-data.mjs

const { TypeDataModel } = foundry.abstract;
const { 
  SchemaField, 
  NumberField,
  StringField,
  BooleanField
} = foundry.data.fields;

export class CRPActorData extends TypeDataModel {
  static defineSchema() {
    return {

      // ATRYBUTY + SKILLE
      attributes: new SchemaField({
        strength: new SchemaField({
          value: new NumberField({ initial: 3, min: 0, max: 10 }),
          skills: new SchemaField({
            twoHanded: new SchemaField({ value: new NumberField({ initial: 0, min: 0, max: 10 }) }),
            endurance: new SchemaField({ value: new NumberField({ initial: 0, min: 0, max: 10 }) }),
            shield: new SchemaField({ value: new NumberField({ initial: 0, min: 0, max: 10 }) }),
            brawl: new SchemaField({ value: new NumberField({ initial: 0, min: 0, max: 10 }) }),
            intimidate: new SchemaField({ value: new NumberField({ initial: 0, min: 0, max: 10 }) })
          })
        }),

        agility: new SchemaField({
          value: new NumberField({ initial: 3, min: 0, max: 10 }),
          skills: new SchemaField({
            athletics: new SchemaField({ value: new NumberField({ initial: 0, min: 0, max: 10 }) }),
            oneHanded: new SchemaField({ value: new NumberField({ initial: 0, min: 0, max: 10 }) }),
            lightWeapons: new SchemaField({ value: new NumberField({ initial: 0, min: 0, max: 10 }) }),
            craft: new SchemaField({ value: new NumberField({ initial: 0, min: 0, max: 10 }) }),
            stealth: new SchemaField({ value: new NumberField({ initial: 0, min: 0, max: 10 }) })
          })
        }),

        perception: new SchemaField({
          value: new NumberField({ initial: 3, min: 0, max: 10 }),
          skills: new SchemaField({
            empathy: new SchemaField({ value: new NumberField({ initial: 0, min: 0, max: 10 }) }),
            disguise: new SchemaField({ value: new NumberField({ initial: 0, min: 0, max: 10 }) }),
            survival: new SchemaField({ value: new NumberField({ initial: 0, min: 0, max: 10 }) }),
            awareness: new SchemaField({ value: new NumberField({ initial: 0, min: 0, max: 10 }) }),
            ranged: new SchemaField({ value: new NumberField({ initial: 0, min: 0, max: 10 }) })
          })
        }),

        character: new SchemaField({
          value: new NumberField({ initial: 3, min: 0, max: 10 }),
          skills: new SchemaField({
            charisma: new SchemaField({ value: new NumberField({ initial: 0, min: 0, max: 10 }) }),
            animals: new SchemaField({ value: new NumberField({ initial: 0, min: 0, max: 10 }) }),
            carousing: new SchemaField({ value: new NumberField({ initial: 0, min: 0, max: 10 }) }),
            gossip: new SchemaField({ value: new NumberField({ initial: 0, min: 0, max: 10 }) }),
            persuasion: new SchemaField({ value: new NumberField({ initial: 0, min: 0, max: 10 }) })
          })
        }),

        reason: new SchemaField({
          value: new NumberField({ initial: 3, min: 0, max: 10 }),
          skills: new SchemaField({
            literacy: new SchemaField({ value: new NumberField({ initial: 0, min: 0, max: 10 }) }),
            languages: new SchemaField({ value: new NumberField({ initial: 0, min: 0, max: 10 }) }),
            medicine: new SchemaField({ value: new NumberField({ initial: 0, min: 0, max: 10 }) }),
            politics: new SchemaField({ value: new NumberField({ initial: 0, min: 0, max: 10 }) }),
            knowledge: new SchemaField({ value: new NumberField({ initial: 0, min: 0, max: 10 }) })
          })
        })
      }),

      // WSPÓŁCZYNNIKI POCHODNE
      derived: new SchemaField({
        initiative: new NumberField({ initial: 0 }),
        willpower: new NumberField({ initial: 0 }),

        health: new SchemaField({
          value: new NumberField({ initial: 1 }),
          max: new NumberField({ initial: 1, min: 1 })
        }),

        maneuver: new NumberField({ initial: 0 })
      }),

      // ZASOBY
      resources: new SchemaField({
        fate: new SchemaField({
          value: new NumberField({ initial: 2, min: 0 })
        })
      }),

      // STANY
      state: new SchemaField({
        life: new StringField({
          initial: "alive",
          choices: ["alive", "dead"]
        }),
        bleeding: new BooleanField({ initial: false }),
        unconscious: new BooleanField({ initial: false })
      }),

      equipment: new SchemaField({
  rightHand: new SchemaField({
    id: new StringField({ nullable: true }),
    name: new StringField({ nullable: true }),
    img: new StringField({ nullable: true })
  }),

  leftHand: new SchemaField({
    id: new StringField({ nullable: true }),
    name: new StringField({ nullable: true }),
    img: new StringField({ nullable: true })
  }),

  armor: new SchemaField({
    id: new StringField({ nullable: true }),
    name: new StringField({ nullable: true }),
    img: new StringField({ nullable: true })
  })
}),

bio: new SchemaField({
  description: new StringField({ initial: "" })
}),

    };


    
  }
}