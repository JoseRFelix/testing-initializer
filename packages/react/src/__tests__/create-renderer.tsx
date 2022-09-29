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

it("should allow to create renderer with relationships coming from props itself", async () => {
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

  const renderTestComponent = createRenderer()
    .addData("currentUser", () => db.user.create())
    .addData("toDos", () => [db.toDo.create(), db.toDo.create(), db.toDo.create()])
    .addData(
      "project",
      ({ currentUser, toDos }) => db.project.create({ toDos, user: currentUser }) as unknown as Project
    )
    .setProps(({ project, currentUser, toDos }) => ({ project, currentUser, toDos }))
    .setComponent(TestComponent)
    .setRenderFunction(render)
    .build()

  const { project, currentUser, toDos } = await renderTestComponent()

  expect(screen.getByText(currentUser.name)).toBeInTheDocument()
  expect(screen.getByText(project.name)).toBeInTheDocument()

  for (const toDo of toDos) {
    expect(screen.getByText(toDo.name)).toBeInTheDocument()
  }
})

it("should allow to create renderer with relationships coming from data", async () => {
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

  const renderTestComponent = createRenderer()
    .addData("currentUser", () => db.user.create())
    .addData("toDos", () => [db.toDo.create(), db.toDo.create(), db.toDo.create()])
    .setProps(({ currentUser, toDos }) => ({
      project: db.project.create({ toDos, user: currentUser }) as unknown as Project,
      currentUser,
      toDos,
    }))
    .setComponent(TestComponent)
    .setRenderFunction(render)
    .build()

  const { project, currentUser, toDos } = await renderTestComponent({
    data: {
      currentUser: db.user.create({ name: "User override" }),
    },
  })

  expect(screen.getByText(currentUser.name)).toBeInTheDocument()
  expect(screen.getByText(project.name)).toBeInTheDocument()

  for (const toDo of toDos) {
    expect(screen.getByText(toDo.name)).toBeInTheDocument()
  }
})

it("should allow to create renderer with custom render function", async () => {
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

  const renderTestComponent = createRenderer()
    .setComponent(TestComponent)
    .setRenderFunction(renderWithProviders)
    .build()

  await renderTestComponent()

  expect(screen.getByText("I'am inside a custom render function wrapper!")).toBeInTheDocument()
  expect(screen.getByText("hey")).toBeInTheDocument()
})

it("should allow to override data", async () => {
  const TestComponent = ({ login, feature }: { login: { email: string }; feature: { name: string } }) => {
    return (
      <div>
        <p>{login.email}</p>
        <p>{feature.name}</p>
      </div>
    )
  }

  const renderTestComponent = createRenderer()
    .addData("login", () => ({ email: "test@test.com" }))
    .addData("feature", () => ({ name: "feature" }))
    .setProps(({ login, feature }) => ({ login, feature }))
    .setComponent(TestComponent)
    .setRenderFunction(render)
    .build()

  await renderTestComponent({
    data: {
      login: {
        email: "overriden@email.com",
      },
      feature: {
        name: "overriden feature",
      },
    },
  })
})

it("should call events, and pass data and props as parameters", async () => {
  const TestComponent = ({ login, feature }: { login: { email: string }; feature: { name: string } }) => {
    return (
      <div>
        <p>{login.email}</p>
        <p>{feature.name}</p>
      </div>
    )
  }

  const onRender = jest.fn()
  const onBeforeRender = jest.fn()
  const onRemount = jest.fn()

  const renderTestComponent = createRenderer()
    .addData("login", () => ({ email: "test@test.com" }))
    .addData("feature", () => ({ name: "feature" }))
    .setProps(({ login, feature }) => ({ login, feature }))
    .setComponent(TestComponent)
    .setRenderFunction(render)
    .on("onRender", onRender)
    .on("onBeforeRender", onBeforeRender)
    .on("onRemount", onRemount)
    .build()

  const { remount, login, feature } = await renderTestComponent()

  expect(onRender).toHaveBeenCalledTimes(1)
  expect(onRender).toHaveBeenCalledWith({ data: { login, feature }, props: { login, feature } })

  expect(onBeforeRender).toHaveBeenCalledTimes(1)
  expect(onBeforeRender).toHaveBeenCalledWith({ data: { login, feature }, props: { login, feature } })

  expect(onRemount).toHaveBeenCalledTimes(0)

  await remount()

  expect(onRender).toHaveBeenCalledTimes(1)
  expect(onBeforeRender).toHaveBeenCalledTimes(1)

  expect(onRemount).toHaveBeenCalledTimes(1)
  expect(onRemount).toHaveBeenCalledWith({ data: { login, feature }, props: { login, feature } })
})

it("should not call overriden function and it should still derive value from dependency", async () => {
  const TestComponent = ({ login, feature }: { login: { email: string }; feature: { name: string } }) => {
    return (
      <div>
        <p>{login.email}</p>
        <p>{feature.name}</p>
      </div>
    )
  }

  const loginMock = jest.fn()
  const featureMock = jest.fn()
  const notOverridenMock = jest.fn()

  const renderTestComponent = createRenderer()
    .addData("login", () => {
      loginMock()
      return { email: "test@test.com" }
    })
    .addData("feature", () => {
      featureMock()
      return { name: "feature" }
    })
    .addData("notOverriden", ({ feature }) => {
      notOverridenMock()
      return { name: feature.name }
    })
    .setProps(({ login, feature }) => ({ login, feature }))
    .setComponent(TestComponent)
    .setRenderFunction(render)
    .build()

  const { notOverriden } = await renderTestComponent({
    data: {
      login: {
        email: "overriden@email.com",
      },
      feature: {
        name: "overriden feature",
      },
    },
  })

  expect(loginMock).not.toHaveBeenCalled()
  expect(featureMock).not.toHaveBeenCalled()
  expect(notOverridenMock).toHaveBeenCalled()

  expect(notOverriden.name).toEqual("overriden feature")
})
