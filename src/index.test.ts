import SqlGen, { OR } from "./index"
import * as mysql from "mysql2"
import { ErrorSetNull, ErrorUnknownOperator, ErrorWhereInEmptyArray, ErrorWhereNull } from "./helper"

describe("Select", function () {
	test("*", () => {
		const s = SqlGen.select("user", "*")
		const sql = mysql.format(s.sql, s.args)
		expect(sql).toBe("SELECT * FROM `user`")
	})

	describe("where conditions", function () {
		test("basic", () => {
			const s = SqlGen.select("user", "id,order", {
				uid: 1,
				nick: { IN: ["a", "b", "c"] },
				mobile: { LIKE: "+0x%" },
				age: {
					">=": 10, "<=": 20, [OR]: { IN: [0, 1, 2] },
				},
				[OR]: {
					uid: 2,
					nick: { LIKE: "test_%" },
				},
			})
			const sql = mysql.format(s.sql, s.args)
			const expectedSql = "SELECT `id`, `order` FROM `user` WHERE `uid` = 1 AND `nick` IN ('a', 'b', 'c') AND `mobile` LIKE '+0x%' AND ((`age` >= 10 AND `age` <= 20) OR (`age` IN (0, 1, 2))) OR (`uid` = 2 AND `nick` LIKE 'test_%')"
			expect(sql).toBe(expectedSql)
		})
		test("with empty or operator", () => {
			const s = SqlGen.select("user", "id,order", {
				age: {
					">=": 10, "<=": 20, [OR]: {},
				},
			})
			const sql = mysql.format(s.sql, s.args)
			const expectedSql = "SELECT `id`, `order` FROM `user` WHERE `age` >= 10 AND `age` <= 20"
			expect(sql).toBe(expectedSql)
		})
		test("with empty operator", () => {
			const s = SqlGen.select("user", "id,order", {
				age: {
					[OR]: {},
				},
			})
			const sql = mysql.format(s.sql, s.args)
			const expectedSql = "SELECT `id`, `order` FROM `user`"
			expect(sql).toBe(expectedSql)
		})
		test("with json(object) value", () => {
			const s = SqlGen.select("user", "id,order", { age: null })
			const sql = mysql.format(s.sql, s.args)
			const expectedSql = "SELECT `id`, `order` FROM `user` WHERE `age` IS NULL"
			expect(sql).toBe(expectedSql)
		})
		test("empty [in] value in [in] operator", () => {
			expect(() => SqlGen.select("user", "id,order", { age: { IN: [] } }))
				.toThrowError(ErrorWhereInEmptyArray)
		})
		// test("with empty in", () => {})
		test("with empty or", () => {
			const s = SqlGen.select("user", "id,order", {
				uid: 1,
				[OR]: {},
			})
			const sql = mysql.format(s.sql, s.args)
			expect(sql).toBe("SELECT `id`, `order` FROM `user` WHERE `uid` = 1")
		})
		test("with unknown operator", () => {
			expect(() => SqlGen.select("user", "id,order", { uid: { UNKNOWN: 1 } })).toThrowError(ErrorUnknownOperator)
		})
	})

	test("order by", () => {
		SqlGen.select("user", null, null, "id DESC")
	})

	describe("limit", function () {
		test("with string", () => {
			const s = SqlGen.select("user", null, null, null, "1, 1")
			const sql = mysql.format(s.sql, s.args)
			const expectedSql = "SELECT * FROM `user` LIMIT 1, 1"
			expect(sql).toBe(expectedSql)
		})

		test("with offset object", () => {
			const s = SqlGen.select("user", null, null, null, {
				offset: 10,
				size: 2,
			})
			const sql = mysql.format(s.sql, s.args)
			const expectedSql = "SELECT * FROM `user` LIMIT 10, 2"
			expect(sql).toBe(expectedSql)
		})

		test("with offset object (offset is null)", () => {
			const s = SqlGen.select("user", null, null, null, {
				size: 2,
			})
			const sql = mysql.format(s.sql, s.args)
			const expectedSql = "SELECT * FROM `user` LIMIT 2"
			expect(sql).toBe(expectedSql)
		})
	})
})

function toSqlParam (obj: unknown | unknown[]): string {
	return JSON.stringify(JSON.stringify(obj)).replace(/((^")|("$))/g, "")
}

describe("Insert", function () {

	test("basic", () => {
		const data = {
			id: 1,
			nick: "ben",
			age: 10,
			created_at: "1901-01-01 01:01:01",
			extras: {
				t1: false,
			},
			fav: ["basketball", "football"],
		}
		const s = SqlGen.insert("user", data)
		const sql = mysql.format(s.sql, s.args)
		const expectedSql = `INSERT INTO \`user\` SET \`id\` = 1, \`nick\` = 'ben', \`age\` = 10, \`created_at\` = '${ data.created_at }', \`extras\` = '${ toSqlParam(data.extras) }', \`fav\` = '${ toSqlParam(data.fav) }'`
		expect(sql).toBe(expectedSql)
	})
	test("empty obj", () => {
		expect(() => SqlGen.insert("user", {})).toThrowError(ErrorSetNull)
	})
})

describe("Delete", function () {
	test("basic", () => {
		const where = {
			id: 1,
		}
		const s = SqlGen.del("user", where)
		const sql = mysql.format(s.sql, s.args)
		const expectedSql = "DELETE FROM `user` WHERE `id` = 1"
		expect(sql).toBe(expectedSql)
	})
	test("error when where conditions empty", () => {
		const where = {}
		expect(() => SqlGen.del("user", where)).toThrowError(ErrorWhereNull)
	})
	test("error when where conditions empty (or key only", () => {
		const where = {
			[OR]: {},
		}
		expect(() => SqlGen.del("user", where)).toThrowError(ErrorWhereNull)
	})
	test("error empty in", () => {
		const where = {
			id: { IN: [] },
		}
		expect(() => SqlGen.del("user", where)).toThrowError(ErrorWhereInEmptyArray)
	})
})

describe("Update", function () {
	test("empty where throw error", () => {
		const where = {}
		const setData = {
			nick: "john",
		}
		expect(() => SqlGen.update("user", where, setData)).toThrowError(ErrorWhereNull)
	})
	test("empty where throw error (empty or", () => {
		const where = {
			[OR]: {},
		}
		const setData = {
			nick: "john",
		}
		expect(() => SqlGen.update("user", where, setData)).toThrowError(ErrorWhereNull)
	})
	test("empty set data throw error", () => {
		const where = { id: 1 }
		const setData = {}
		expect(() => SqlGen.update("user", where, setData)).toThrowError(ErrorSetNull)
	})
	test("null where condition", () => {
		const where = { id: null }
		const setData = { id: 1 }
		const s = SqlGen.update("user", where, setData)
		const sql = mysql.format(s.sql, s.args)
		const expectedSql = "UPDATE `user` SET `id` = 1 WHERE `id` IS NULL"
		expect(sql).toBe(expectedSql)
	})
})
