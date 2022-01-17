import React from "react"
import { createDatabase, generateId, manyOf, oneOf } from "@react-testing/data"
import { render, screen } from "@testing-library/react"

import { createRenderer } from "../create-renderer"

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

const db = createDatabase<APITypes>({
  user: {
    id: () => generateId("user-pk"),
    name: () => `User ${generateId("user-name")}`,
  },
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

interface TestComponentProps {
  currentUser: User
  toDos: ToDo[]
  project: Project
}

const TestComponent = ({ currentUser, project, toDos }: TestComponentProps) => {
  return (
    <div>
      <p>{currentUser.name}</p>
      <p>{project.name}</p>
      <div>
        {toDos.map(({ id, name }) => (
          <p key={id}>{name}</p>
        ))}
      </div>
    </div>
  )
}

it.only("should ", () => {
  const renderTestComponent = createRenderer(db, {
    component: TestComponent,
    data: {
      currentUser: db.user.create(),
      toDos: [db.toDo.create(), db.toDo.create(), db.toDo.create()],
      project: db.project.create() as unknown as Project,
    },
    renderFunction: render,
  })

  renderTestComponent()

  screen.debug()
})
