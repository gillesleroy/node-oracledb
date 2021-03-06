/* Copyright (c) 2018, Oracle and/or its affiliates. All rights reserved. */

/******************************************************************************
 *
 * You may not use the identified files except in compliance with the Apache
 * License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * The node-oracledb test suite uses 'mocha', 'should' and 'async'.
 * See LICENSE.md for relevant licenses.
 *
 * NAME
 *   173. soda5.js
 *
 * DESCRIPTION
 *   More tests for sodaCollection class
 *
 *****************************************************************************/
'use strict';

const oracledb = require('oracledb');
const should   = require('should');
const dbconfig = require('./dbconfig.js');
const sodaUtil = require('./sodaUtil.js');

const t_contents = [
  { id: 1001, name: "Gillian",  office: "Shenzhen" },
  { id: 1002, name: "Chris",    office: "Melbourne" },
  { id: 1003, name: "Changjie", office: "Shenzhen" },
  { id: 1004, name: "Venkat",   office: "Bangalore" },
  { id: 1005, name: "May",      office: "London" },
  { id: 1006, name: "Joe",      office: "San Francisco" },
  { id: 1007, name: "Gavin",    office: "New York" }
];

describe('173. soda5.js', () => {

  before(async function() {
    const runnable = await sodaUtil.checkPrerequisites();
    if (!runnable) this.skip();

    await sodaUtil.cleanup();
  });

  it('173.1 create index, basic case', async () => {
    let conn, collection;
    try {
      conn = await oracledb.getConnection(dbconfig);

      let soda = conn.getSodaDatabase();
      collection = await soda.createCollection("soda_test_173_1");

      let indexSpec = {
        "name": "OFFICE_IDX",
        "fields": [
          {
            "path": "office",
            "datatype": "string",
            "order": "asc"
          }
        ]
      };
      await collection.createIndex(indexSpec);

      await Promise.all(
        t_contents.map(function(content) {
          return collection.insertOne(content);
        })
      );

      // Fetch back
      let empInShenzhen = await collection.find()
        .filter({ "office": {"$like": "Shenzhen"} })
        .count();
      should.strictEqual(empInShenzhen.count, 2);

      await conn.commit();

    } catch(err) {
      should.noConflict.exist(err);
    } finally {
      if (collection) {
        let res = await collection.drop();
        should.strictEqual(res.dropped, true);
      }
      if (conn) {
        try {
          await conn.close();
        } catch(err) {
          should.not.exist(err);
        }
      }
    }
  }); // 173.1

  it('173.2 query row not via indexSpec', async () => {
    let conn, collection;
    try {
      conn = await oracledb.getConnection(dbconfig);

      let soda = conn.getSodaDatabase();
      collection = await soda.createCollection("soda_test_173_2");

      let indexSpec = {
        "name": "OFFICE_IDX",
        "fields": [
          {
            "path": "office",
            "datatype": "string",
            "order": "asc"
          }
        ]
      };
      await collection.createIndex(indexSpec);

      await Promise.all(
        t_contents.map(function(content) {
          return collection.insertOne(content);
        })
      );
    } catch(err) {
      should.not.exist(err);
    }

    try {
      // Fetch back
      let empInShenzhen = await collection.find()
        .filter({ "name": {"$like": "Changjie"} })
        .count();
      should.strictEqual(empInShenzhen.count, 1);

    } catch(err) {
      should.not.exist(err);
    }

    try {
      await conn.commit();
    }
    catch(err) {
      should.not.exist(err);
    }

    if (collection) {
      let res = await collection.drop();
      should.strictEqual(res.dropped, true);
    }
    if (conn) {
      try {
        await conn.close();
      } catch(err) {
        should.not.exist(err);
      }
    }
  }); // 173.2

  it('173.3 Negative - invalid indexSpec, invalid index property', async () => {
    let conn, collection;
    try {
      conn = await oracledb.getConnection(dbconfig);

      let soda = conn.getSodaDatabase();
      collection = await soda.createCollection("soda_test_173_3");

    } catch(err) {
      should.not.exist(err);
    }

    try {
      let indexSpec = { "foo": "bar" };
      await collection.createIndex(indexSpec);

    } catch(err) {
      should.exist(err);
      // ORA-40719: invalid index property foo
      (err.message).should.startWith('ORA-40719:');
    }

    if (collection) {
      let res = await collection.drop();
      should.strictEqual(res.dropped, true);
    }
    if (conn) {
      try {
        await conn.close();
      } catch(err) {
        should.not.exist(err);
      }
    }
  }); // 173.3

  it('173.4 Negative - createIndex() without parameter', async () => {
    let conn, collection;
    try {
      conn = await oracledb.getConnection(dbconfig);

      let soda = conn.getSodaDatabase();
      collection = await soda.createCollection("soda_test_173_4");

    } catch(err) {
      should.not.exist(err);
    }

    try {
      await collection.createIndex();

    } catch(err) {
      should.exist(err);
      should.strictEqual(err.message, 'undefined 1');
    }

    if (collection) {
      let res = await collection.drop();
      should.strictEqual(res.dropped, true);
    }
    if (conn) {
      try {
        await conn.close();
      } catch(err) {
        should.not.exist(err);
      }
    }
  }); // 173.4

  it('173.5 collection.drop(), basic case', async () => {
    let conn, collection;
    try {
      conn = await oracledb.getConnection(dbconfig);
      let sd = conn.getSodaDatabase();

      let collName = "soda_test_173_5";
      collection = await sd.createCollection(collName);

    } catch(err) {
      should.not.exist(err);
    } finally {
      if (collection) {
        let res = await collection.drop();
        should.strictEqual(res.dropped, true);
      }
      if (conn) {
        try {
          await conn.close();
        } catch(err) {
          should.not.exist(err);
        }
      }
    }
  }); // 173.5

  it('173.6 drop multiple times, no error thrown', async () => {
    let conn, collection;
    try {
      conn = await oracledb.getConnection(dbconfig);
      let sd = conn.getSodaDatabase();

      let collName = "soda_test_173_6";
      collection = await sd.createCollection(collName);

      let res = await collection.drop();
      should.strictEqual(res.dropped, true);

      res = await collection.drop();
      should.strictEqual(res.dropped, false);

      res = await collection.drop();
      should.strictEqual(res.dropped, false);

    } catch(err) {
      should.not.exist(err);
    } finally {
      if (conn) {
        try {
          await conn.close();
        } catch(err) {
          should.not.exist(err);
        }
      }
    }
  }); // 173.6

  it('173.7 dropIndex(), basic case', async () => {
    let conn, collection;
    try {
      conn = await oracledb.getConnection(dbconfig);

      let soda = conn.getSodaDatabase();
      collection = await soda.createCollection("soda_test_173_7");

      let indexSpec = {
        "name": "OFFICE_IDX",
        "fields": [
          {
            "path": "office",
            "datatype": "string",
            "order": "asc"
          }
        ]
      };
      await collection.createIndex(indexSpec);

      await Promise.all(
        t_contents.map(function(content) {
          return collection.insertOne(content);
        })
      );

      // Fetch back
      let empInShenzhen = await collection.find()
        .filter({ "office": {"$like": "Shenzhen"} })
        .count();
      should.strictEqual(empInShenzhen.count, 2);

      // drop index
      let indexName = indexSpec.name;
      await collection.dropIndex(indexName);

      await conn.commit();

    } catch(err) {
      should.noConflict.exist(err);
    } finally {
      if (collection) {
        let res = await collection.drop();
        should.strictEqual(res.dropped, true);
      }
      if (conn) {
        try {
          await conn.close();
        } catch(err) {
          should.not.exist(err);
        }
      }
    }
  }); // 173.7

  it('173.8 dropping index does not impact query', async () => {
    let conn, collection;
    try {
      conn = await oracledb.getConnection(dbconfig);

      let soda = conn.getSodaDatabase();
      collection = await soda.createCollection("soda_test_173_8");

      let indexSpec = {
        "name": "OFFICE_IDX",
        "fields": [
          {
            "path": "office",
            "datatype": "string",
            "order": "asc"
          }
        ]
      };
      await collection.createIndex(indexSpec);

      await Promise.all(
        t_contents.map(function(content) {
          return collection.insertOne(content);
        })
      );

      // drop index
      let indexName = indexSpec.name;
      await collection.dropIndex(indexName);

      // Fetch back
      let empInShenzhen = await collection.find()
        .filter({ "office": {"$like": "Shenzhen"} })
        .count();
      should.strictEqual(empInShenzhen.count, 2);

      await conn.commit();

    } catch(err) {
      should.noConflict.exist(err);
    } finally {
      if (collection) {
        let res = await collection.drop();
        should.strictEqual(res.dropped, true);
      }
      if (conn) {
        try {
          await conn.close();
        } catch(err) {
          should.not.exist(err);
        }
      }
    }
  }); // 173.8

  it('173.9 The index is dropped regardless of the auto commit mode', async () => {
    let conn, collection;
    try {
      conn = await oracledb.getConnection(dbconfig);

      let soda = conn.getSodaDatabase();
      collection = await soda.createCollection("soda_test_173_9");

      let indexSpec = {
        "name": "OFFICE_IDX",
        "fields": [
          {
            "path": "office",
            "datatype": "string",
            "order": "asc"
          }
        ]
      };
      await collection.createIndex(indexSpec);

      await Promise.all(
        t_contents.map(function(content) {
          return collection.insertOne(content);
        })
      );

      // Fetch back
      let empInShenzhen = await collection.find()
        .filter({ "office": {"$like": "Shenzhen"} })
        .count();
      should.strictEqual(empInShenzhen.count, 2);

      // drop index
      let indexName = indexSpec.name;
      await collection.dropIndex(indexName);

      // Does not commit changes
      // await conn.commit();

    } catch(err) {
      should.noConflict.exist(err);
    } finally {
      if (collection) {
        let res = await collection.drop();
        should.strictEqual(res.dropped, true);
      }
      if (conn) {
        try {
          await conn.close();
        } catch(err) {
          should.not.exist(err);
        }
      }
    }
  }); // 173.9

  it('173.10 Negative - dropIndex() no parameter', async () => {
    let conn, collection;
    try {
      conn = await oracledb.getConnection(dbconfig);

      let soda = conn.getSodaDatabase();
      collection = await soda.createCollection("soda_test_173_10");

      let indexSpec = {
        "name": "OFFICE_IDX",
        "fields": [
          {
            "path": "office",
            "datatype": "string",
            "order": "asc"
          }
        ]
      };
      await collection.createIndex(indexSpec);

      await Promise.all(
        t_contents.map(function(content) {
          return collection.insertOne(content);
        })
      );

      // Fetch back
      let empInShenzhen = await collection.find()
        .filter({ "office": {"$like": "Shenzhen"} })
        .count();
      should.strictEqual(empInShenzhen.count, 2);

      // drop index multiple times
      let indexName = indexSpec.name;

      await collection.dropIndex(indexName);
      await collection.dropIndex(indexName);
      await collection.dropIndex(indexName);

      await conn.commit();

    } catch(err) {
      should.noConflict.exist(err);
    } finally {
      if (collection) {
        let res = await collection.drop();
        should.strictEqual(res.dropped, true);
      }
      if (conn) {
        try {
          await conn.close();
        } catch(err) {
          should.not.exist(err);
        }
      }
    }
  }); // 173.10

  it('173.11 option object of dropIndex(), basic case', async () => {
    let options = { "force" : true };
    await dropIdxOpt(options);
  }); // 173.11

  it('173.12 option object of dropIndex(), boolean value is false', async () => {
    let options = { "force" : false };
    await dropIdxOpt(options);
  }); // 173.12

});

const dropIdxOpt = async function(opts) {
  let conn, collection;
  try {
    conn = await oracledb.getConnection(dbconfig);

    let soda = conn.getSodaDatabase();
    collection = await soda.createCollection("soda_test_173_7");

    let indexSpec = {
      "name": "OFFICE_IDX",
      "fields": [
        {
          "path": "office",
          "datatype": "string",
          "order": "asc"
        }
      ]
    };
    await collection.createIndex(indexSpec);

    await Promise.all(
      t_contents.map(function(content) {
        return collection.insertOne(content);
      })
    );

    // Fetch back
    let empInShenzhen = await collection.find()
      .filter({ "office": {"$like": "Shenzhen"} })
      .count();
    should.strictEqual(empInShenzhen.count, 2);

    // drop index
    let indexName = indexSpec.name;
    await collection.dropIndex(indexName, opts);

    await conn.commit();

  } catch(err) {
    should.noConflict.exist(err);
  } finally {
    if (collection) {
      let res = await collection.drop();
      should.strictEqual(res.dropped, true);
    }
    if (conn) {
      try {
        await conn.close();
      } catch(err) {
        should.not.exist(err);
      }
    }
  }
};
