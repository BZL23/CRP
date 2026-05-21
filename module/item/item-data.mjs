// module/item/item-data.mjs 

function commonItemSchema() {

  return {

    price: new SchemaField({

      floren: new NumberField({
        initial: 0,
        min: 0,
        integer: true
      }),

      grzywna: new NumberField({
        initial: 0,
        min: 0,
        integer: true
      }),

      skojec: new NumberField({
        initial: 0,
        min: 0,
        integer: true
      }),

      grosz: new NumberField({
        initial: 0,
        min: 0,
        integer: true
      }),

      kwartnik: new NumberField({
        initial: 0,
        min: 0,
        integer: true
      }),

      denar: new NumberField({
        initial: 0,
        min: 0,
        integer: true
      }),

      obol: new NumberField({
        initial: 0,
        min: 0,
        integer: true
      }),

      total: new NumberField({
        initial: 0,
        min: 0,
        integer: true
      })

    }),

    weight: new StringField({
      initial: "Ś",
      choices: ["M", "Ś", "D", "W"]
    }),

    durability: new SchemaField({
      value: new NumberField({
        initial: 1,
        min: 0
      }),

      max: new NumberField({
        initial: 1,
        min: 0
      })
    }),

    description: new StringField({
      initial: ""
    })

  };

}

const { TypeDataModel } = foundry.abstract;
const {
  SchemaField,
  NumberField,
  StringField,
  BooleanField
} = foundry.data.fields;

export class CRPWeaponData extends TypeDataModel {
  static defineSchema() {
    return {

  ...commonItemSchema(),

      // MECHANIKA
      // damage: new NumberField({ initial: 1, min: 0 }),

      skill: new StringField({ initial: "oneHanded" }), 
      // KLUCZ: musi matchować config.skills

      hands: new NumberField({ initial: 1 }), // 1 / 2

      range: new StringField({ initial: "melee" }), // melee / ranged

      // TAGI SYSTEMOWE
      equipped: new BooleanField({ initial: false }),

    };
  }
}

export class CRPArmorData extends TypeDataModel {
  static defineSchema() {
    return {
      ...commonItemSchema(),
      protection: new NumberField({ initial: 0 }),

    };
  }
}

export class CRPShieldData extends TypeDataModel {
  static defineSchema() {
    return {
      ...commonItemSchema(),
      protection: new NumberField({ initial: 0 }),

    };
  }
}

export class CRPStuffData extends TypeDataModel {
  static defineSchema() {
    return {
      ...commonItemSchema(),

    };
  }
}
