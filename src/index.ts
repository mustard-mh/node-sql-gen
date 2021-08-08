import { Limit, Where, Data, Sql, OR as _OR } from "./types"
import {
	genData, genWhere, getFields,
	ErrorSetNull,
	ErrorWhereNull,
} from "./helper"

export const OR = _OR

export function select (table: string, fields?: string, where?: Where, orderBy?: string, limit?: Limit | string): Sql {
	let sql = `SELECT ${getFields(fields)} FROM ??`
	let args: unknown[] = [table]
	const whereSql = genWhere(where)
	if (whereSql.ok !== false) {
		sql += ` WHERE ${ whereSql.sql }`
		args = args.concat(whereSql.args)
	}
	if (orderBy != null) {
		sql += " ORDER BY " + orderBy
	}
	if (limit != null) {
		if (typeof limit === "string") {
			sql += " LIMIT " + limit
		} else {
			const { offset, size } = limit
			sql += ` LIMIT ${ offset != null ? `${ offset }, ` : "" }${ size }`
		}
	}
	return { sql, args }
}

export function count (table: string, where?: Where): Sql {
	let sql = "SELECT COUNT(1) AS `total` FROM ??"
	let args: unknown[] = [table]
	const whereSql = genWhere(where)
	if (whereSql.ok !== false) {
		sql += ` WHERE ${ whereSql.sql }`
		args = args.concat(whereSql.args)
	}
	return { sql, args }
}

export function insert (table: string, data: Data): Sql {
	const sql = "INSERT INTO ?? SET ?"
	const genSetData = genData(data)
	if (Object.keys(genSetData).length === 0) {
		throw new Error(ErrorSetNull)
	}
	const args = [table, genSetData]
	return { sql, args }
}

export function update (table: string, where: Where, setData: Data): Sql {
	let sql = "UPDATE ?? SET ? WHERE"
	const genSetData = genData(setData)
	if (Object.keys(genSetData).length === 0) {
		throw new Error(ErrorSetNull)
	}
	let args: unknown[] = [table, genSetData]
	// append where statement
	const whereSql = genWhere(where)
	if (whereSql.ok !== false) {
		sql += ` ${ whereSql.sql }`
		args = args.concat(whereSql.args)
	} else {
		throw new Error(ErrorWhereNull)
	}
	return { sql, args }
}

export function del (table: string, where: Where): Sql {
	let sql = "DELETE FROM ?? WHERE"
	let args: unknown[] = [table]
	// append where statement
	const whereSql = genWhere(where)
	if (whereSql.ok !== false) {
		sql += ` ${ whereSql.sql }`
		args = args.concat(whereSql.args)
	} else {
		throw new Error(ErrorWhereNull)
	}
	return { sql, args }
}

export default {
	select, insert, update, del,
	count,
	// Keyword
	OR,
}
