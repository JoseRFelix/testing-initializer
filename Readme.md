# Testing Initializer

Simple and complete bootstrapping testing utilities that encourage efficient testing practices.

## Motivation

When testing front-end applications you often need to initialize components, and create mock data matching your
back-end. Instead of having to do repeat this process in every test, this library will provide you with a set of
utilities for bootstrapping your tests without boilerplate and facilitate efficient data-driven API mocking.

## Packages

- [@testing-initializer/react](#react-testing-initializer): Testing bootstrapping utilities for React. This library
  contains `@testing-initializer/data`. So, if you are using React, I recommend installing only this package.
- [@testing-initializer/data](#data-testing-initializer): Wrapper around [@msw/data]("https://github.com/mswjs/data")
  that allows for typed data modelling and relation on a mocked database.

## React Testing Initializer

This package contains all necessary utilities for bootstrapping React components in your tests.

### Installation

```shell
npm i @testing-initializer/data
```

or with Yarn:

```shell
yarn add @testing-initializer/react
```

### Usage

First, let's create our mock database:

```js
import { createDatabase, generateId } from "@testing-initializer/react"

interface User {
	id:  number
	name:  string
}

interface ToDo {
	id:  number
	name:  string
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
		date: () => new  Date().toISOString(),
		name: () => `Project ${generateId("project-name")}`,
		user: oneOf("user"),
		toDos: manyOf("toDo"),
	},
})
```

Now, let's say we have the following component:

```js
interface TestComponentProps {
  project: Project;
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

```js
import { createRenderer, createDatabase, generateId } from "@testing-initializer/react"

...

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
```

Notice the `data` property. These extra properties are useful for getting generated data outside of the component props.

With this renderer, we can render our components consistently within tests:

```js
it("...", () => {
  const { project, currentUser, toDos } = renderTestComponent()
})
```

We can also render override its `data` or `props`:

```js
it("...", () => {
  renderTestComponent({ currentUser: db.user.create({ name: "User override" }) })
})
```

## Data Testing Initializer

This package allows you to create a [@msw/data]("https://github.com/mswjs/data") type-safe database. It will read nested
arrays as a `many of` relationship and objects as a `one of` relationship.

### Installation

```shell
npm i @testing-initializer/data
```

or with Yarn:

```shell
yarn add @testing-initializer/data
```

### Usage

First make you have your types available:

```js
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
```

Proceed to create your mock database based on this types.

```js
import { createDatabase, generateId } from "@testing-initializer/data"

const db =
  createDatabase <
  APITypes >
  {
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
  }
```

Now you can use all database methods available in [@msw/data]("https://github.com/mswjs/data"):

```js
db.user.create()
db.user.findFirst({ ... })
db.project.findMany({ ... })
```
