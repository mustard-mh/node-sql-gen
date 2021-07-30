import * as _ from "lodash"
import { Data, Operator, Where, OkSql, OR, AvailableOperator } from "./types"

export const ErrorWhereNull = "where cannot be null or empty"
export const ErrorSetNull = "set data cannot be null or empty"
export const ErrorWhereInEmptyArray = "where condition [in] value must be array (len>0)"
export const ErrorUnknownOperator = "unknown operator, only " + JSON.stringify(AvailableOperator) + " is available"

const getFiled = (field: string): string => "`" + field + "`"
export const getFields = (fields?: string): string => (fields != null && fields !== "*") ? fields.split(",").map(e => getFiled(e)).join(", ") : "*"

const withOperator = (field: string, operator: Operator): OkSql => {
	const sqlArr = []
	const orSqlArr = []
	let args = []
	let orArgs = []
	for (const opr in operator) {
		if (!AvailableOperator.includes(opr)) {
			throw new Error(ErrorUnknownOperator)
		}
		if (opr === OR) {
			const tmpOpr = withOperator(field, operator[opr] as Where)
			if (tmpOpr.ok === false) {
				continue
			}
			orSqlArr.push(tmpOpr.sql)
			orArgs = orArgs.concat(tmpOpr.args)
			continue
		}
		let oprValue = operator[opr]
		if (opr === "IN") {
			if (!Array.isArray(oprValue) || oprValue.length === 0) {
				throw new Error(ErrorWhereInEmptyArray)
			}
			oprValue = [oprValue]
		}
		sqlArr.push(`${ field } ${ opr } ?`)
		args.push(oprValue)
	}
	let sql = sqlArr.join(" AND ")
	if (orSqlArr.length > 0) {
		sql = "((" + sql + ") OR (" + orSqlArr.join(" AND ") + "))"
		args = args.concat(orArgs)
	}
	sql = sql.replace(/ AND\s+OR /g, " OR ")
		.replace(/^\s+OR /g, "")
	return { sql, args, ok: sqlArr.length > 0 || orSqlArr.length > 0 }
}
export const genWhere = (where?: Where): OkSql => {
	if (where == null) {
		return { sql: "", args: [], ok: false }
	}
	where = _.cloneDeep(where)
	const sqlArr = []
	let args = []
	const orSqlArr = []
	let orArgs = []
	for (const key in where) {
		if (key === OR) {
			const tmpWhere = genWhere(where[key] as Where)
			if (tmpWhere.ok === false) {
				continue
			}
			orSqlArr.push(tmpWhere.sql)
			orArgs = orArgs.concat(tmpWhere.args)
			continue
		}
		const value = where[key]
		const field = getFiled(key)
		if (value == null) {
			sqlArr.push(`${ field } IS NULL`)
			continue
		}
		if (typeof value === "string" || typeof value === "number") {
			sqlArr.push(`${ field } = ?`)
			args.push(value)
			continue
		}
		const operator = value as Operator
		const operatorSql = withOperator(field, operator)
		if (operatorSql.ok === true) {
			sqlArr.push(operatorSql.sql)
			args = args.concat(operatorSql.args)
		}
	}
	let sql = sqlArr.join(" AND ")
	if (orSqlArr.length > 0) {
		sql += " OR (" + orSqlArr.join(" AND ") + ")"
		args = args.concat(orArgs)
	}
	sql = sql.replace(/ AND\s+OR /g, " OR ").replace(/^\s+OR /g, "")
	return { sql, args, ok: (sqlArr.length > 0 || orSqlArr.length > 0) }
}

export const genData = (data: Data): Data => {
	const newData = _.cloneDeep(data)
	for (const key in newData) {
		const value = newData[key]
		if (value != null && typeof value === "object") {
			newData[key] = JSON.stringify(value)
		}
	}
	return newData
}
