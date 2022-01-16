import { factory, manyOf, oneOf } from "@mswjs/data"
import { createDatabase } from "../create-database"

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

it("should allow to create database with relations", () => {
  interface APITypes {
    user: User
    toDo: ToDo
    project: Project
  }

  const db = createDatabase<APITypes>({
    user: {
      id: () => 1,
      name: () => "User 1",
    },
    toDo: {
      id: () => 1,
      name: () => "Todo 1",
    },
    project: {
      id: () => 1,
      date: () => new Date().toISOString(),
      name: () => "Project 1",
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

  console.log(project.user)
})
