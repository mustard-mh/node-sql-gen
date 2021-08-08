# node-sql-gen

Simple sql query generator. No orm, `raw sql forever`!! 🎉

## Install

```shell
# yarn
$ yarn add node-sql-gen

# npm
$ npm install node-sql-gen
```

## Documents

for more details, check src/ dir

### Functions

* function [select](#select) (table: string, fields?: string, where?: [Where](#type-where), orderBy?: string, limit?: Limit | string): Sql
* function [insert](#insert) (table: string, data: [Data](#type-data)): Sql
* function [update](#update) (table: string, where: [Where](#type-where), setData: [Data](#type-data)): Sql
* function [del](#delete) (table: string, where: [Where](#type-where)): Sql
* function [count](#count) (table: string, where?: [Where](#type-where)): Sql

### Type Where

Support `=` `>` `<` `>=` `<=` `LIKE` `IN` Operators

```js
const whereExample01 = {
  id: 1, // same with id: { "=": 1 }
  nick: { LIKE: "%ben%" }, 
  age: { ">": 10, "<=": 15, [OR]: { "IN": [1, 2, 3] } }, // means (10, 15] + 1 2 3
}
```

### Type Data

Support JSON type

```js
const setDataExample01 = {
  id: 1,
  nick: 'newNick',
  favorite: ['games', 'food']
}
```

### Error Messages
```js
AvailableOperator = ["LIKE", "IN", ">", "<", ">=", "<=", "=", OR]

ErrorWhereNull = "where cannot be null or empty"
ErrorSetNull = "set data cannot be null or empty"
ErrorWhereInEmptyArray = "where condition [in] value must be array (len>0)"
ErrorUnknownOperator = "unknown operator, only " + JSON.stringify(AvailableOperator) + " is available"
```

## Usage

#### Exec with mysql2

```js
const sqlGen = require('node-sql-gen')
const mysql2 = require('mysql2')

const dbClient = mysql2.createPool({ ... })

async function query (gen) {
  return dbClient.query(gen.sql, gen.args)
}

query(sqlGen.select("user")).then(console.log).catch(console.error)
```

#### Select

```js
const OR = sqlGen.OR
let s0 = sqlGen.select('user')              // { sql: 'SELECT * FROM ??', args: [ 'user' ] }
console.log(mysql2.format(s0.sql, s0.args)) // SELECT * FROM `user`

let s1 = sqlGen.select('user', 'id,order', {
	id: 1,
	[OR]: {
		nick: { LIKE: 'ben%' },
		age: { '>=': 10 },
	},
}, 'id DESC', { offset: 0, size: 20 })
console.log(mysql2.format(s1.sql, s1.args))
// { sql: 'SELECT `id`, `order` FROM ?? WHERE `id` = ? OR (`nick` LIKE ? AND `age` >= ?) ORDER BY id DESC LIMIT 0, 20', args: [ 'user', 1, 'ben%', 10 ] }
// SELECT `id`, `order` FROM `user` WHERE `id` = 1 OR (`nick` LIKE 'ben%' AND `age` >= 10) ORDER BY id DESC LIMIT 0, 20
```

#### Insert

```js
const s2 = sqlGen.insert('user', {
	id: 1,
	nick: 'ben',
	null_: null,
	int_: 10,
	datetime_: '1901-01-01 01:01:01',
	json: {
		t1: false,
	},
	json2: ['basketball', 'football'],
})
console.log(mysql2.format(s2.sql, s2.args))
// {
//   sql: 'INSERT INTO ?? SET ?',
//   args: [
//     'user',
//     { id: 1, nick: 'ben', null_: null, int_: 10, datetime_: '1901-01-01 01:01:01', json: '{"t1":false}', json2: '["basketball","football"]'}
//   ]
// }
// INSERT INTO `user` SET `id` = 1, `nick` = 'ben', `null_` = NULL, `int_` = 10, `datetime_` = '1901-01-01 01:01:01', `json` = '{\"t1\":false}', `json2` = '[\"basketball\",\"football\"]'
```

#### Update

```js
const updateWhere = { id: null }
const setData = { id: 1 }
const s3 = sqlGen.update('user', updateWhere, setData) // { sql: 'UPDATE ?? SET ? WHERE `id` IS NULL', args: [ 'user', { id: 1 } ] }
console.log(mysql2.format(s3.sql, s3.args))            // UPDATE `user` SET `id` = 1 WHERE `id` IS NULL
```

#### Delete

```js
const deleteWhere = { id: null }
const s4 = sqlGen.del('user', deleteWhere)  // { sql: 'DELETE FROM ?? WHERE `id` IS NULL', args: [ 'user' ] }
console.log(mysql2.format(s4.sql, s4.args)) // DELETE FROM `user` WHERE `id` IS NULL
```

#### Count

```js
const countWhere = { id: { IN: [1, 2, 3] } }
const s5 = sqlGen.count('user', countWhere) // { sql: 'SELECT COUNT(1) AS `total` FROM ?? WHERE `id` IN ?', args: [ 'user', [ [ 1, 2, 3 ] ] ] }
console.log(mysql2.format(s5.sql, s5.args)) // SELECT COUNT(1) AS `total` FROM `user` WHERE `id` IN (1, 2, 3)
```
