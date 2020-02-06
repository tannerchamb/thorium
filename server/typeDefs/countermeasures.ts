import {gql, withFilter} from "apollo-server-express";
import {pubsub} from "../helpers/subscriptionManager";
import App from "../app";
import {moduleTypes} from "../classes/Countermeasure";
import uuid from "uuid";
const mutationHelper = require("../helpers/mutationHelper").default;
// We define a schema that encompasses all of the types
// necessary for the functionality in this file.
const schema = gql`
  type Countermeasures implements SystemInterface {
    id: ID!
    simulatorId: ID
    class: String
    type: String
    name: String!
    displayName: String!
    upgradeName: String
    upgraded: Boolean
    damage: Damage!
    power: Power!
    stealthFactor: Float
    locations: [Room]

    materials: CountermeasureResources!
    slots: CountermeasureSlot!
    launched: [Countermeasure!]!
  }
  type Countermeasure {
    id: ID!
    name: String!
    modules: [CountermeasureModule!]!
    locked: Boolean!
    active: Boolean!
    building: Boolean!
    totalPowerUsed: Float!
    readyToLaunch: Boolean!
    powerUsage: Float!
    availablePower: Float!
    buildPercentage: Float!
  }
  type CountermeasureResources {
    copper: Int!
    titanium: Int!
    carbon: Int!
    plastic: Int!
    plasma: Int!
  }
  type CountermeasureConfigOptions {
    type: String!
    label: String!
  }
  type CountermeasureModule {
    id: ID!
    name: String!
    description: String!
    powerRequirement: Float!
    resourceRequirements: CountermeasureResources!
    configurationOptions: [CountermeasureConfigOptions]!
    config: JSON!
    buildProgress: Float!
    activated: Boolean!
  }
  enum CountermeasureSlotEnum {
    slot1
    slot2
    slot3
    slot4
    slot5
    slot6
    slot7
    slot8
  }
  type CountermeasureSlot {
    slot1: Countermeasure
    slot2: Countermeasure
    slot3: Countermeasure
    slot4: Countermeasure
    slot5: Countermeasure
    slot6: Countermeasure
    slot7: Countermeasure
    slot8: Countermeasure
  }

  extend type Query {
    countermeasures(simulatorId: ID!): Countermeasures
    countermeasureModuleType: [CountermeasureModule]
  }
  extend type Mutation {
    countermeasuresCreateCountermeasure(
      id: ID!
      slot: CountermeasureSlotEnum!
      name: String!
    ): Countermeasure
    countermeasuresRemoveCountermeasure(
      id: ID!
      slot: CountermeasureSlotEnum!
    ): String
    countermeasuresLaunchCountermeasure(
      id: ID!
      slot: CountermeasureSlotEnum!
    ): String
    countermeasuresLaunchUnlockedCountermeasures(id: ID!): String
    countermeasuresBuildCountermeasure(
      id: ID!
      slot: CountermeasureSlotEnum!
    ): String
    countermeasuresAddModule(
      id: ID!
      slot: CountermeasureSlotEnum!
      moduleType: String!
    ): Countermeasure
    countermeasuresRemoveModule(
      id: ID!
      slot: CountermeasureSlotEnum!
      moduleId: ID!
    ): String
    countermeasuresConfigureModule(
      id: ID!
      slot: CountermeasureSlotEnum!
      moduleId: ID!
      config: JSON!
    ): String
  }
  extend type Subscription {
    countermeasuresUpdate(simulatorId: ID!): Countermeasures
  }
`;

const resolver = {
  Query: {
    countermeasures(rootQuery, {simulatorId}) {
      return App.systems.find(
        s => s.simulatorId === simulatorId && s.class === "Countermeasures",
      );
    },
    countermeasureModuleType() {
      return moduleTypes;
    },
  },
  Mutation: mutationHelper(schema),
  Subscription: {
    countermeasuresUpdate: {
      resolve(rootQuery) {
        console.log("resolved");
        return rootQuery;
      },
      subscribe: withFilter(
        (_rootValue, {simulatorId}) => {
          const id = uuid.v4();
          process.nextTick(() => {
            console.log(
              "Countermeasures",
              App.systems.filter(s => s.class === "Countermeasures"),
            );
            const data = App.systems.find(s => {
              return (
                s.simulatorId === simulatorId && s.class === "Countermeasures"
              );
            });
            console.log(data);
            pubsub.publish(id, data);
          });
          console.log("subscribed");
          return pubsub.asyncIterator([id, "countermeasuresUpdate"]);
        },
        (rootValue, args) => {
          console.log("filtered");
          console.log(rootValue, args);
          return rootValue?.simulatorId === args?.simulatorId;
        },
      ),
    },
  },
};

export default {schema, resolver};
