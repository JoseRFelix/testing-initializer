# React Testing Initializer

This package contains all necessary utilities for bootstrapping React components in your tests.

### Installation

```shell
npm i --save-dev @testing-initializer/data
```

or with Yarn:

```shell
yarn add -D @testing-initializer/react
```

### Usage

First, let's create our mock database:

```ts
import { createDatabase, generateId } from "@testing-initializer/react"

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
```

Now, let's say we have the following component:

```ts
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
```

We can now proceed to create a renderer, a reusable function that renders your component with its necessary props:

```ts
import { createRenderer, createDatabase, generateId } from "@testing-initializer/react"

...

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
```

Notice the `data` property. These extra properties are useful for getting generated data outside of the component props.

With this renderer, we can render our components consistently within tests:

```ts
it("...", () => {
  const { project, currentUser, toDos } = renderTestComponent()
})
```

We can also render override its `data` or `props`:

```ts
it("...", () => {
  renderTestComponent({
    data: {
      currentUser: db.user.create({ name: "User override" }),
    },
  })
})
```

## License

This project is licensed under the terms of the
[MIT license](https://github.com/JoseRFelix/testing-initializer/blob/main/LICENSEr)
