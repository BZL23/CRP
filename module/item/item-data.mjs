// module/item/item-data.mjs 

function commonItemSchema() {

  return {

    price: new SchemaField({

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

      cwiercgrosz: new NumberField({
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

function migrateCommonItemData(source) {
  delete source.price?.floren;
  delete source.hands;
  return source;
}

const { TypeDataModel } = foundry.abstract;
const {
  SchemaField,
  NumberField,
  StringField,
  BooleanField
} = foundry.data.fields;

export class CRPWeaponData extends TypeDataModel {
  static migrateData(source) {
    migrateCommonItemData(source);
    return super.migrateData(source);
  }

  static defineSchema() {
    return {

  ...commonItemSchema(),

      // MECHANIKA
      // damage: new NumberField({ initial: 1, min: 0 }),

      skill: new StringField({ initial: "oneHanded" }), 
      // KLUCZ: musi matchować config.skills

      range: new StringField({ initial: "melee" }), // melee / ranged

      // TAGI SYSTEMOWE
      equipped: new BooleanField({ initial: false }),

    };
  }
}

export class CRPArmorData extends TypeDataModel {
  static migrateData(source) {
    migrateCommonItemData(source);
    return super.migrateData(source);
  }

  static defineSchema() {
    return {
      ...commonItemSchema(),
      protection: new NumberField({ initial: 0 }),

    };
  }
}

export class CRPShieldData extends TypeDataModel {
  static migrateData(source) {
    migrateCommonItemData(source);
    return super.migrateData(source);
  }

  static defineSchema() {
    return {
      ...commonItemSchema(),
      protection: new NumberField({ initial: 0 }),

    };
  }
}

export class CRPStuffData extends TypeDataModel {
  static migrateData(source) {
    migrateCommonItemData(source);
    return super.migrateData(source);
  }

  static defineSchema() {
    return {
      ...commonItemSchema(),

    };
  }
}

export class CRPLanguageData extends TypeDataModel {
  static migrateData(source) {
    if (!source.role) source.role = "unassigned";
    if (!["latin", "cyrillic", "arabic", "none"].includes(source.alphabet)) {
      source.alphabet = "none";
    }
    return super.migrateData(source);
  }

  static defineSchema() {
    return {
      alphabet: new StringField({
        initial: "none",
        choices: ["latin", "cyrillic", "arabic", "none"]
      }),
      description: new StringField({ initial: "" }),
      role: new StringField({
        initial: "unassigned",
        choices: ["unassigned", "native", "foreign"]
      })
    };
  }
}
