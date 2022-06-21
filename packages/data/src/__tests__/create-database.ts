import { manyOf, oneOf } from "@mswjs/data"

import { createDatabase } from "../create-database"
import { generateId } from "../utils/id"

interface User {
  id: number
  name: string
}

interface ToDo {
  id: number
  name: string
}

interface Project {
  id: number
  name: string
  date: string
  user: User
  toDos: ToDo[]
}

interface APITypes {
  user: User
  toDo: ToDo
  project: Project
}

it("should allow to create database with relations", () => {
  const db = createDatabase<APITypes>({
    user: () => ({
      id: () => generateId("user-pk"),
      name: () => `User ${generateId("user-name")}`,
    }),
    toDo: {
      id: () => generateId("toDo-pk"),
      name: () => `Todo ${generateId("toDo-name")}`,
    },
    project: {
      id: () => generateId("project-pk"),
      date: () => new Date().toISOString(),
      name: () => `Project ${generateId("project-name")}`,
      user: oneOf("user"),
      toDos: manyOf("toDo"),
    },
  })

  expect(db).toHaveProperty("user")
  expect(db).toHaveProperty("toDo")
  expect(db).toHaveProperty("project")

  const user = db.user.create()
  const toDo = db.toDo.create()

  const project = db.project.create({ user, toDos: [toDo] })

  expect(project).toMatchObject({ name: "Project 1", date: project.date, id: 1, user: user, toDos: [toDo] })
})

it("should create '__pk' property when id is missing", () => {
  const db = createDatabase({
    user: {
      randomId: () => generateId("user-pk"),
      name: () => `User ${generateId("user-name")}`,
    },
  })

  const user = db.user.create()

  expect(user).toHaveProperty("__pk")
  expect(user).toHaveProperty("randomId")
  expect(user).toHaveProperty("name")
})

it("should allow for model definition value to be a function", () => {
  const fn = jest.fn()

  const db = createDatabase({
    user: () => {
      fn()
      return { randomId: () => generateId("user-pk"), name: () => `User ${generateId("user-name")}` }
    },
  })

  expect(fn).toHaveBeenCalled()
})
