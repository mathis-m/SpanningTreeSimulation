// start reading at last line ;)
const packageType = {
	INFORMATION: 0,
	RETURN_INFORMATION: 1,
	NORMAL: 2
};

class SpanTreeLink {
	constructor(nodes, value)
	{
		this.nodes = nodes;
		this.cost = value;
	}
}

// a package we can send through the "network"
class SimulationPackage {
	constructor(type, data, target)
	{
		this.type = type;
		this.data = data;
		this.target = target;
	}
	
}

// makes a spantree
class MinimalSpanTree {
	
	allNodesAreConnected(allNodes)
	{
		let allConnected = true;
		allNodes.forEach(node =>
			allConnected &= this.shortestLinks.findIndex(link => link.nodes.findIndex(n => n.name === node.name) !== -1) !== -1);
		return !!allConnected;
	};
	
	constructor(spanTreeLinks)
	{
		this.shortestLinks = [];
		
		let links = [...spanTreeLinks];
		links = links.sort((a, b) => a.cost - b.cost).reverse();
		const allNodes = [];
		spanTreeLinks.forEach(link => {
			link.nodes.forEach(node => {
				if (allNodes.findIndex(n => n.name === node.name) === -1)
				{
					allNodes.push(node);
					if (!this.root || this.root.value > node.value)
					{
						this.root = node;
					}
				}
			})
		});
		
		
		while (this.allNodesAreConnected(allNodes) === false)
		{
			this.shortestLinks.push(links.pop())
		}
		this.shortestLinks.push(links.pop())
	}
	
	linkToString()
	{
		const sorted = this.shortestLinks.map(l => ({
			...l, nodes: l.nodes.sort((a, b) => {
				if (a.name < b.name)
				{
					return -1;
				}
				if (a.name > b.name)
				{
					return 1;
				}
				return 0;
			})
		})).sort((a, b) => {
			if (a.nodes[0].name < b.nodes[0].name)
			{
				return -1;
			}
			if (a.nodes[0].name > b.nodes[0].name)
			{
				return 1;
			}
			return 0;
		});
		let ret = "";
		sorted.forEach(link => {
			ret += `${link.nodes[0].name} - ${link.nodes[1].name};\n\t`
		});
		return ret;
	}
	
}

// node of SpanTree
class SpanTreeNode {
	// name
	// value
	
	
	// networking
	// send information package through the complete network
	sendInformationRequest()
	{
		const siblingNodes = this.emitPing();
		siblingNodes.forEach(node => {
			this.emitPackage(new SimulationPackage(
				packageType.INFORMATION,
				{
					name: this.name,
					value: this.value,
					hops: [
						{
							node: this,
							cost: 0
						}
					]
				},
				node
			));
		});
	};
	
	// gets sibling nodes
	emitPing()
	{
		return this.network.emitPing();
	}
	
	// passes the package to the network
	emitPackage(somePackage)
	{
		this.network.emitPackage(somePackage);
	};
	
	// appends this nodes information to the information request package
	appendMyInformation(informationPackage, wayCost)
	{
		informationPackage.data.hops.push({
			node: this,
			cost: wayCost
		});
		informationPackage.data.hops = [...informationPackage.data.hops];
		return informationPackage
	};
	
	// process the returned information Package and builds the minimal Spantree
	processReturnedInformation(informationPackage)
	{
		for (let i = 0; i < informationPackage.data.hops.length - 1; i++)
		{
			const nodes = informationPackage.data.hops.map(h => h.node).slice(i, i + 2);
			const cost = informationPackage.data.hops[i + 1].cost;
			const knownConnectionIndex = this.connections.findIndex(connection => connection.nodes.findIndex(n => n.name === nodes[0].name) !== -1 && connection.nodes.findIndex(n => n.name === nodes[1].name) !== -1);
			if (knownConnectionIndex === -1)
			{
				this.connections.push(new SpanTreeLink(nodes, cost))
			}
		}
		this.minimalDiscoveredSpanTree = new MinimalSpanTree(this.connections);
	};
	
	// receive a package from the network with the cost
	receivePackage(somePackage, wayCost)
	{
		// handle information type package
		if (somePackage.type === packageType.INFORMATION)
		{
			const siblingNodes = this.emitPing();
			let isFinished = true;
			for (const node of siblingNodes)
			{
				isFinished &= somePackage.data.hops.findIndex(h => node.name === h.node.name) !== -1;
				if (!isFinished) break;
			}
			let newPackage = {...this.appendMyInformation(somePackage, wayCost)};
			if (isFinished)
			{
				newPackage = new SimulationPackage(packageType.RETURN_INFORMATION, newPackage.data, newPackage.data.hops[newPackage.data.hops.length - 2].node)
			}
			if (newPackage.type === packageType.RETURN_INFORMATION)
			{
				this.emitPackage(newPackage);
			}
			else
			// send information package to all siblings
				siblingNodes.forEach(node => {
					if (somePackage.data.hops.findIndex(h => h.node.name === node.name) === -1)
					{
						const p = new SimulationPackage(newPackage.type, {
							node: {...newPackage.data.node},
							value: newPackage.data.value,
							hops: [...newPackage.data.hops]
						}, node);
						this.emitPackage(p);
					}
				})
		}
		// handle Return package
		else if (somePackage.type === packageType.RETURN_INFORMATION)
		{
			// if it wants to me
			if (somePackage.data.hops[0].node.name === this.name)
			{
				this.processReturnedInformation(somePackage);
			}
			// else let it go back the way it came before it was a Return package
			else
			{
				const targetIndex = somePackage.data.hops.findIndex(n => n.node.name === this.name) - 1;
				somePackage.target = somePackage.data.hops[targetIndex].node;
				this.emitPackage(somePackage);
			}
		}
	};
	
	// internal
	setNetwork(packageEmitFunc, pingEmitFunc)
	{
		this.network = {
			emitPackage: (somePackage) => packageEmitFunc(this, somePackage),
			emitPing: () => pingEmitFunc(this)
		};
	}
	
	constructor(name, value)
	{
		this.name = name;
		this.value = value;
		// known Data
		this.connections = [];
	}
}

// isolates the knowledge of the node.
// a node can only know the information that it receives through the network and the network is designed to only send information to sibling nodes
class NodeContainer {
	constructor(node, links)
	{
		this.node = node;
		this.links = links;
	}
}


// this is our "network"
function SimulationContext()
{
	// it keeps track of all Node Containers
	SimulationContext.prototype.container = [];
	
	// allows a node to send a Package
	SimulationContext.prototype.sendPackage = (node, somePackage) => {
		// get the container in with the node is isolated
		const container = this.getContainerOf(node);
		// look up possible links if target is reachable with link
		let targetIndex = container.links.findIndex(link => link.nodes.findIndex(n => n.name === somePackage.target.name) !== -1);
		if (targetIndex !== -1)
		{
			// send package to target
			somePackage.target.receivePackage(somePackage, container.links[targetIndex].cost);
		}
		else
		{
			// violation of package flow
			debugger;
		}
	};
	
	// returns sibling nodes
	SimulationContext.prototype.pingSurrounding = (node) => {
		return this.getContainerOf(node).links
			.flatMap(l => l.nodes)
			.filter(n => n.name !== node.name);
	};
	
	// returns a container of specified node
	SimulationContext.prototype.getContainerOf = (node) => {
		return this.container.find(c => c.node.name === node.name);
	};
	
	// registers a node to the simulation context (creates a new container where node and links are stored)
	SimulationContext.prototype.registerNode = (node, links) => {
		let nodeContainer = new NodeContainer(node, links);
		nodeContainer.node.setNetwork(this.sendPackage, this.pingSurrounding);
		return this.container.push(nodeContainer);
	};
}


const simulate = (nodes, someLinks) => {
	// get simulation Context
	const simulationContext = new SimulationContext();
	// get them in the right data format
	const spantreeNodes = [];
	for (const node of nodes)
	{
		spantreeNodes.push(new SpanTreeNode(node.name, node.value));
	}
	// register each node and its links to the simulation context
	spantreeNodes.forEach(node => {
		const links = someLinks.filter(link => link.nodes.findIndex(n => n === node.name) !== -1);
		const spantreeLinks = links.map(link => new SpanTreeLink(spantreeNodes.filter(n => n.name === link.nodes[0] || n.name === link.nodes[1]), link.cost));
		simulationContext.registerNode(node, spantreeLinks);
	});
	
	// let each node broadcast its Information.
	simulationContext.container.forEach(c => {
		c.node.sendInformationRequest();
	});
	return simulationContext.__proto__.container[0].node.minimalDiscoveredSpanTree.root.minimalDiscoveredSpanTree;
};

// run the simulation
