export type SqlValue = string | number | null | Record<string, unknown> | Array<unknown>

export const OR = "Symbol(OR)"

export const AvailableOperator = ["LIKE", "IN", ">", "<", ">=", "<=", "=", OR]

export interface Operator {
	LIKE?: string
	IN?: (string | number)[]
	">"?: string | number
	"<"?: string | number
	">="?: string | number
	"<="?: string | number
	"="?: string | number
	[OR]?: Operator
}

export interface Limit {
	offset?: number,
	size: number
}

// Value type WhereI if for [OR] key `ONLY`
export interface Where {
	[key: string]: null | string | number | Operator | Where

	[OR]?: Where
}

export interface Data {
	[key: string]: SqlValue
}

export interface Sql {
	sql: string
	args: unknown[]
}

export interface OkSql extends Sql {
	ok: boolean
}