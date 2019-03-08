# SpanningTreeSimulation
# Get Things working
- clone this git repo
- open `index.html` in Chrome(maybe other Browsers)
# Architecture

- `SimulationContext` holds NodeContainers
- `NodeContainer` knows the `SpanTreeNode` and it's `SpanTreeLinks`

This isolates the node.

A node can do a ping and receives nodes that are siblings.
A node can send a package to a target.
A node can receive a package.

The SimulationContext controls the data flow of packages.

Data flow is btw. unidirectional, `SpanTreeNode` > `SimulationConext` > `SpanTreeNode`
this ensures that a node only can get Information by receiving packages.
