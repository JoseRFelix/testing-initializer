import React from "react"
import { createDatabase, generateId, manyOf, oneOf } from "@testing-initializer/data"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"

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

it("should allow to create renderer with relationships coming from props itself", () => {
  interface TestComponentProps {
    currentUser: User
    toDos: ToDo[]
    project: Project
  }

  const TestComponent = ({ project }: TestComponentProps) => {
    return (
      <div>
        <p>{project.user.name}</p>
        <p>{project.name}</p>
        <div>
          {project.toDos.map(({ id, name }) => (
            <p key={id}>{name}</p>
          ))}
        </div>
      </div>
    )
  }

  const renderTestComponent = createRenderer({
    component: TestComponent,
    props: {
      currentUser: db.user.create(),
      toDos: [db.toDo.create(), db.toDo.create(), db.toDo.create()],
      project: ({ currentUser, toDos }) => db.project.create({ toDos, user: currentUser }) as unknown as Project,
    },
    renderFunction: render,
  })

  const { project, currentUser, toDos } = renderTestComponent()

  expect(screen.getByText(currentUser.name)).toBeInTheDocument()
  expect(screen.getByText(project.name)).toBeInTheDocument()

  for (const toDo of toDos) {
    expect(screen.getByText(toDo.name)).toBeInTheDocument()
  }
})

it("should allow to create renderer with relationships coming from data", () => {
  interface TestComponentProps {
    project: Project
  }

  const TestComponent = ({ project }: TestComponentProps) => {
    return (
      <div>
        <p>{project.user.name}</p>
        <p>{project.name}</p>
        <div>
          {project.toDos.map(({ id, name }) => (
            <p key={id}>{name}</p>
          ))}
        </div>
      </div>
    )
  }

  const renderTestComponent = createRenderer({
    component: TestComponent,
    data: {
      currentUser: db.user.create(),
      toDos: [db.toDo.create(), db.toDo.create(), db.toDo.create()],
    },
    props: ({ currentUser, toDos }) => ({
      project: db.project.create({ toDos, user: currentUser }) as unknown as Project,
    }),
    renderFunction: render,
  })

  const { project, currentUser, toDos } = renderTestComponent({
    currentUser: db.user.create({ name: "User override" }),
  })

  expect(screen.getByText(currentUser.name)).toBeInTheDocument()
  expect(screen.getByText(project.name)).toBeInTheDocument()

  for (const toDo of toDos) {
    expect(screen.getByText(toDo.name)).toBeInTheDocument()
  }
})

it("should allow to create renderer with wrapper", () => {
  const TestComponent = () => {
    return (
      <div>
        <p>hey</p>
      </div>
    )
  }

  const renderTestComponent = createRenderer({
    component: TestComponent,
    renderFunction: render,
    wrapper: ({ children }) => (
      <div>
        <p>I am inside the wrapper!</p>
        {children}
      </div>
    ),
  })

  renderTestComponent()

  expect(screen.getByText("I am inside the wrapper!")).toBeInTheDocument()
  expect(screen.getByText("hey")).toBeInTheDocument()
})

it("should allow to create renderer with custom render function", () => {
  const renderWithProviders = (ui: React.ReactElement) => {
    return {
      ...render(ui, {
        wrapper: ({ children }) => (
          <div>
            <p>I'am inside a custom render function wrapper!</p>
            {children}
          </div>
        ),
      }),
    }
  }

  const TestComponent = () => {
    return (
      <div>
        <p>hey</p>
      </div>
    )
  }

  const renderTestComponent = createRenderer({
    component: TestComponent,
    renderFunction: renderWithProviders,
  })

  renderTestComponent()

  expect(screen.getByText("I'am inside a custom render function wrapper!")).toBeInTheDocument()
  expect(screen.getByText("hey")).toBeInTheDocument()
})
