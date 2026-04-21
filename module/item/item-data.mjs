// module/item/item-data.mjs 

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

      // MECHANIKA
      damage: new NumberField({ initial: 1, min: 0 }),

      skill: new StringField({ initial: "oneHanded" }), 
      // KLUCZ: musi matchować config.skills

      hands: new NumberField({ initial: 1 }), // 1 / 2

      range: new StringField({ initial: "melee" }), // melee / ranged

      // MODYFIKATORY
      accuracy: new NumberField({ initial: 0 }), // do trafienia
      initiative: new NumberField({ initial: 0 }),

      // TAGI SYSTEMOWE
      equipped: new BooleanField({ initial: false }),

      // FLUFF
      weight: new NumberField({ initial: 0 }),
      description: new StringField({ initial: "" }),
    };
  }
}

export class CRPArmorData extends TypeDataModel {
  static defineSchema() {
    return {
      protection: new NumberField({ initial: 0 }),
      weight: new NumberField({ initial: 0 }),
      description: new StringField({ initial: "" })
    };
  }
}

export class CRPShieldData extends TypeDataModel {
  static defineSchema() {
    return {
      protection: new NumberField({ initial: 0 }),
      weight: new NumberField({ initial: 0 }),
      description: new StringField({ initial: "" })
    };
  }
}

export class CRPStuffData extends TypeDataModel {
  static defineSchema() {
    return {
      protection: new NumberField({ initial: 0 }),
      weight: new NumberField({ initial: 0 }),
      description: new StringField({ initial: "" })
    };
  }
}