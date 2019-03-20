# SpanningTreeSimulation
If several switches are connected to each other in a communication network, 
a spanning tree is responsible for loop freedom to prevent broadcast storms.
There is also another boundary condition here:
Each node receives a knot weight which can be used to determine the root.
The Nodes with the lowest weight should form the root in the Spanning Tree, which can,
for example, form the connection to the WAN.
Using a suitable algorithm, each node should know the best path to the root at the end.

Problem: In a communication network, the span tree cannot be calculated at one point.

This solution shows that this is wrong and it is possible.

## Architecture

### Simulation
The Simulation is the place where all known data is located.
- `SpanningTreeNode`s with it's links. (result from parser)
- `Bridge`s for each node one. (which only know name and value of itself)

The simulation provides the Bridge a connection Object(`SimulationConnection`)

**SimulationConnection**
- ping is a Promise that resolves to direct Connected Nodes
- receive Subject is subscribed by the Bridge.
- send is a Subject that is subscribed by the Simulation and if a bridge calls send.next(pkg) the simulation validates the target and if ok calls receive.next(pkg) of target.

So the data flow is always unidirectional.

`Bridge : send(pkg)`    &rarr;  `SimulationConnection : send.next(pkg)`  &rarr;  `Simulation : send.subscribe(...)` 

[if valid continue]  &rarr; `SimulationConnection : receive.next(pkg)`  &rarr;  `Bridge : receive.subscribe(...)` 

This flow results in having isolated nodes that can only communicate via package pipeline shown above.

## Protocol to calculate MST central
- Name: CSTP

1. One Bridge starts the indexing process by sending out a CSTP package with its name in it to all direct connected Bridges.

2. If a Bridge receive such a package, the bridge will send to all directed connected bridge a cstp package except from that where the above package came from.
3. If a Bridge knows all links to all connected Bridges it sends back to the first package's sender all discovered Links.
4. If the Bridge where we started receives a package from all connected Bridges the indexing process us finished.
5. The Bridge will generate a MST out of all known links using kruskal. Then it generates a Routing Table out of the MST.
6. Then it sends to all bridges the full set of discovered links.
7. If such a set is received do step 5 and then forward the pkg to its destination if self != destination.

# Usage
```bash
git clone https://github.com/mathis-m/SpanningTreeSimulation.git
cd SpanningTreeSimulation
npm install
npm run build
```
Now you can open dist/index.html and view the newly build.
