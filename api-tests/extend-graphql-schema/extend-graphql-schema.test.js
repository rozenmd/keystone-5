const { Text } = require('@keystone-alpha/fields');
const { multiAdapterRunners, setupServer, graphqlRequest } = require('@keystone-alpha/test-utils');
const cuid = require('cuid');

function setupKeystone(adapterName) {
  return setupServer({
    adapterName,
    name: `ks5-testdb-${cuid()}`,
    createLists: keystone => {
      keystone.createList('User', {
        fields: { name: { type: Text } },
      });
      keystone.extendGraphQLSchema({
        queries: [
          {
            schema: 'double(x: Int): Int',
            resolver: (_, { x }) => 2 * x,
          },
        ],
        mutations: [
          {
            schema: 'triple(x: Int): Int',
            resolver: (_, { x }) => 3 * x,
          },
        ],
      });
    },
  });
}
multiAdapterRunners().map(({ runner, adapterName }) =>
  describe(`Adapter: ${adapterName}`, () => {
    describe('keystone.extendGraphQLSchema()', () => {
      it(
        'Executes custom queries correctly',
        runner(setupKeystone, async ({ keystone }) => {
          const { data, errors } = await graphqlRequest({
            keystone,
            query: `
              query {
                double(x: 10)
              }
            `,
          });

          if (errors && errors.length) {
            throw errors;
          }

          expect(data.double).toEqual(20);
        })
      );

      it(
        'Executes custom mutations correctly',
        runner(setupKeystone, async ({ keystone }) => {
          const { data, errors } = await graphqlRequest({
            keystone,
            query: `
              mutation {
                triple(x: 10)
              }
            `,
          });

          if (errors && errors.length) {
            throw errors;
          }

          expect(data.triple).toEqual(30);
        })
      );
    });
  })
);
