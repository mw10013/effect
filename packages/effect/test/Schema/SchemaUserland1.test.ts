import { describe, it } from "@effect/vitest"
import { Schema } from "effect"
import * as Util from "effect/test/Schema/TestUtils"

// Define the User schema
const UserSchema = Schema.Struct({
  userId: Schema.Number,
  name: Schema.Union(Schema.String, Schema.Literal(null)),
  role: Schema.String
})

// Type inference from the schema
type User = Schema.Schema.Type<typeof UserSchema>

describe("SchemaUserland1", () => {
  describe("User Schema", () => {
    it("should successfully decode valid user data", async () => {
      const validUsers = [
        {
          userId: 1,
          name: "John Doe",
          role: "admin"
        },
        {
          userId: 2,
          name: null,
          role: "user"
        }
      ]

      for (const user of validUsers) {
        await Util.assertions.decoding.succeed(UserSchema, user)
      }
    })

    it("should fail decoding with invalid types", async () => {
      // String instead of number for userId
      await Util.assertions.decoding.fail(
        UserSchema,
        { userId: "1", name: "John", role: "admin" },
        `{ readonly userId: number; readonly name: string | null; readonly role: string }
└─ ["userId"]
   └─ Expected number, actual "1"`
      )

      // Number instead of string for role
      await Util.assertions.decoding.fail(
        UserSchema,
        { userId: 1, name: "John", role: 123 },
        `{ readonly userId: number; readonly name: string | null; readonly role: string }
└─ ["role"]
   └─ Expected string, actual 123`
      )

      // Invalid type for nullable name
      await Util.assertions.decoding.fail(
        UserSchema,
        { userId: 1, name: undefined, role: "admin" },
        `{ readonly userId: number; readonly name: string | null; readonly role: string }
└─ ["name"]
   └─ string | null
      ├─ Expected string, actual undefined
      └─ Expected null, actual undefined`
      )
    })

    it("should fail decoding with missing properties", async () => {
      await Util.assertions.decoding.fail(
        UserSchema,
        { userId: 1, name: "John" }, // missing role
        `{ readonly userId: number; readonly name: string | null; readonly role: string }
└─ ["role"]
   └─ is missing`
      )
    })

    it("should successfully encode valid user data", async () => {
      const user: User = {
        userId: 1,
        name: "John Doe",
        role: "admin"
      }

      await Util.assertions.encoding.succeed(UserSchema, user, {
        userId: 1,
        name: "John Doe",
        role: "admin"
      })

      const userWithNullName: User = {
        userId: 2,
        name: null,
        role: "user"
      }

      await Util.assertions.encoding.succeed(UserSchema, userWithNullName, {
        userId: 2,
        name: null,
        role: "user"
      })
    })

    // Test roundtrip consistency (decode -> encode -> decode)
    it("should maintain consistency in roundtrip conversions", async () => {
      await Util.assertions.testRoundtripConsistency(UserSchema)
    })
  })
})
