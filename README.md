# sql-gen

Simple sql query generator. No orm, `raw sql forever`!! 🎉

## Install

```shell
# yarn
$ yarn add sql-gen

# npm
$ npm install sql-gen
```

## Documents

for more details, check src/ dir

### Functions

* function select (table: string, fields?: string, where?: Where, orderBy?: string, limit?: Limit | string): Sql
* function insert (table: string, data: Data): Sql
* function update (table: string, where: Where, setData: Data): Sql
* function del (table: string, where: Where): Sql

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
const sqlGen = require('sql-gen')
const mysql = require('mysql2')

const dbClient = mysql.createPool({ ... })

async function query (gen) {
  return dbClient.query(gen.sql, gen.args)
}

query(sqlGen.select("user")).then(console.log).catch(console.error)
```

```js
const OR = sqlGen.OR

function log (obj) {
  console.dir(obj, { depth: null })
  console.log('mysql:', mysql.format(obj.sql, obj.args))
}
```

#### Select

```js
let s0 = sqlGen.select("user")
log(s0)
// { sql: 'SELECT * FROM ??', args: [ 'user' ] }
// mysql: SELECT * FROM `user`

let s1 = sqlGen.select("user", "id,order", {
  id: 1,
  [OR]: {
    nick: { LIKE: "ben%" },
    age: { ">=": 10 },
  }
}, "id DESC", { offset: 0, size: 20 })
log(s1)
// {
//   sql: 'SELECT `id`, `order` FROM ?? WHERE `id` = ? OR (`nick` LIKE ? AND `age` >= ?) ORDER BY id DESC LIMIT 0, 20',
//   args: [ 'user', 1, 'ben%', 10 ]
// }
// mysql: SELECT `id`, `order` FROM `user` WHERE `id` = 1 OR (`nick` LIKE 'ben%' AND `age` >= 10) ORDER BY id DESC LIMIT 0, 20
```

#### Insert

```js
const s2 = sqlGen.insert("user", {
  id: 1,
  nick: "ben",
  null_: null,
  int_: 10,
  datetime_: "1901-01-01 01:01:01",
  json: {
    t1: false,
  },
  json2: ["basketball", "football"],
})
log(s2)
// {
//   sql: 'INSERT INTO ?? SET ?',
//   args: [
//     'user',
//     { id: 1, nick: 'ben', null_: null, int_: 10, datetime_: '1901-01-01 01:01:01', json: '{"t1":false}', json2: '["basketball","football"]'}
//   ]
// }
// mysql: INSERT INTO `user` SET `id` = 1, `nick` = 'ben', `null_` = NULL, `int_` = 10, `datetime_` = '1901-01-01 01:01:01', `json` = '{\"t1\":false}', `json2` = '[\"basketball\",\"football\"]'
```

#### Update

```js
const where = { id: null }
const setData = { id: 1 }
const s3 = sqlGen.update("user", where, setData)
log(s3)
// {
//   sql: 'UPDATE ?? SET ? WHERE `id` IS NULL',
//   args: [ 'user', { id: 1 } ]
// }
// mysql: UPDATE `user` SET `id` = 1 WHERE `id` IS NULL
```
