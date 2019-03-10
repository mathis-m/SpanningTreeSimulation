// start reading at last line ;)
const packageType = {
	INFORMATION: 0,
	RETURN_INFORMATION: 1,
	MST_SHARE: 2,
	NORMAL: 3
};
const packageTypeNames = {
	0: "Information Package",
	1: "Returning Information Package",
	2: "Minimal Spanning Tree Share Package",
	3: "Normal Package"
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
	constructor(type, data, target, destination)
	{
		this.type = type;
		this.data = data;
		this.target = target;
		this.destination = destination;
	}
}

// makes a spantree
class MinimalSpanTree {
	
	getNextNodeWhenGoing(from, to)
	{
		let nextStep = this.getNextStep(from, to);
		return nextStep;
	}
	
	getNextStep(from, to, possibleRet, lastFrom)
	{
		if (from.name === to.name)
		{
			return possibleRet;
		}
		let nodes = this.shortestLinks.filter(l => l.nodes.findIndex(n => n.name === from.name) !== -1)
			.map(siblingLink => siblingLink.nodes.find(n => n.name !== from.name)).filter(n => !lastFrom ? true : n.name !== lastFrom.name);
		for (const node of nodes)
		{
			let ret;
			if (!possibleRet)
			{
				ret = this.getNextStep(node, to, node, from);
			}
			else
			{
				ret = this.getNextStep(node, to, possibleRet, from);
			}
			if (!!ret)
			{
				return ret;
			}
			
		}
		
	}
	
	allNodesAreConnected(allNodes)
	{
		const result = [];
		const array = this.shortestLinks.flatMap(l => l.nodes);
		const map = new Map();
		for (const item of array)
		{
			if (!map.has(item.name))
			{
				map.set(item.name, true);
				result.push(item);
			}
		}
		let allNodesAreIncluded = result.length === allNodes.length;
		let allNodesAreConnected = true;
		if (allNodesAreIncluded)
			for (const node of this.allNodes)
			{
				if (node.name !== this.root.name)
				{
					if (!this.getNextNodeWhenGoing(this.root, node))
					{
						allNodesAreConnected = false;
						break;
					}
				}
			}
		return allNodesAreIncluded && allNodesAreConnected;
	};
	
	constructor(spanTreeLinks)
	{
		this.shortestLinks = [];
		
		let links = [...spanTreeLinks];
		links = links.sort((a, b) => a.cost - b.cost).reverse();
		this.allNodes = [];
		const array = links.flatMap(l => l.nodes);
		
		const map = new Map();
		for (const item of array)
		{
			if (!map.has(item.name))
			{
				map.set(item.name, true);
				this.allNodes.push(item);
			}
		}
		this.root = this.allNodes.sort((a, b) => a.value - b.value)[0];
		
		while (!this.allNodesAreConnected(this.allNodes))
		{
			this.shortestLinks.push(links.pop())
		}
		if (this.shortestLinks.length < 5)
		{
			debugger;
		}
		/*let link = links.pop();
		if (!!link)
			this.shortestLinks.push(link)*/
	}
	
	linkToString()
	{
		const sorted = this.shortestLinks.map(link => {
			return new SpanTreeLink(link.nodes.sort((a, b) => {
					if (a.name < b.name)
					{
						return -1;
					}
					if (a.name > b.name)
					{
						return 1;
					}
					return 0;
				}), link.cost
			);
		}).sort((a, b) => {
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
		this.minimalDiscoveredSpanTree.allNodes.filter(n => n.name !== this.name).forEach(node => {
			this.emitPackage(new SimulationPackage(packageType.MST_SHARE, {mst: this.minimalDiscoveredSpanTree}, this.minimalDiscoveredSpanTree.getNextNodeWhenGoing(this, node), node))
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
		console.log(`Node ${this.name} sends a package(${packageTypeNames["" + somePackage.type]}) to ${somePackage.target.name}`);
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
		return informationPackage;
	};
	
	// process the returned information Package and builds the minimal Spantree
	processReturnedInformation(informationPackage)
	{
		informationPackage.data.forEach(d => {
			for (let i = 0; i < d.hops.length - 1; i++)
			{
				const nodes = d.hops.map(h => h.node).slice(i, i + 2);
				const cost = d.hops[i + 1].cost;
				const knownConnectionIndex = this.connections.findIndex(connection => connection.nodes.findIndex(n => n.name === nodes[0].name) !== -1 && connection.nodes.findIndex(n => n.name === nodes[1].name) !== -1);
				if (knownConnectionIndex === -1)
				{
					this.connections.push(new SpanTreeLink(nodes, cost));
				}
			}
		});
		this.minimalDiscoveredSpanTree = new MinimalSpanTree(this.connections);
		this.network.emitReceivedInformation({
			informationPackage,
			mst: this.minimalDiscoveredSpanTree,
			node: this
		});
		
	};
	
	// receive a package from the network with the cost
	receivePackage(somePackage, wayCost)
	{
		// handle information type package
		if (somePackage.type === packageType.INFORMATION)
		{
			this.handleInformationPackage(somePackage, wayCost);
		}
		// handle Return package
		else if (somePackage.type === packageType.RETURN_INFORMATION)
		{
			this.handleReturnedInformationPackage(somePackage);
		}
		else if (somePackage.type === packageType.MST_SHARE)
		{
			this.minimalDiscoveredSpanTree = somePackage.data.mst;
			this.handlePackage(somePackage);
		}
		else if (somePackage.type === packageType.NORMAL)
		{
			this.handlePackage(somePackage);
		}
	};
	
	handleReturnedInformationPackage(somePackage)
	{
// if it wants to me
		if (somePackage.data[0].hops[0].node.name === this.name)
		{
			this.processReturnedInformation(somePackage);
		}
		// else let it go back the way it came before it was a Return package
		else
		{
			let targetIndex = -2;
			let c = -1;
			while (targetIndex < 0)
			{
				c++;
				targetIndex = somePackage.data[c].hops.findIndex(n => n.node.name === this.name) + 1;
			}
			
			console.log(`Received IPackage at ${this.name}<=${somePackage.data[c].hops[targetIndex].node.name}`);
			this.countSplits--;
			if (this.countSplits === 0 && !this.queuedReturnInformationPackage)
			{
				let targetIndex = -2;
				let c = -1;
				while (targetIndex < 0)
				{
					c++;
					targetIndex = somePackage.data[c].hops.findIndex(n => n.node.name === this.name) - 1;
				}
				somePackage.target = somePackage.data[c].hops[targetIndex].node;
				this.emitPackage(somePackage);
			}
			else
			{
				if (!this.queuedReturnInformationPackage)
				{
					this.queuedReturnInformationPackage = somePackage;
				}
				else if (this.countSplits === 0)
				{
					let targetIndex = -2;
					let c = -1;
					while (targetIndex < 0)
					{
						c++;
						targetIndex = this.queuedReturnInformationPackage.data[c].hops.findIndex(n => n.node.name === this.name) - 1;
					}
					this.queuedReturnInformationPackage.target = this.queuedReturnInformationPackage.data[c].hops[targetIndex].node;
					this.emitPackage(this.queuedReturnInformationPackage);
				}
				else
				{
					let arr = somePackage.data.length !== undefined ? [...somePackage.data] : [somePackage.data];
					this.queuedReturnInformationPackage.data.push(...arr);
				}
			}
		}
	}
	
	handleInformationPackage(somePackage, wayCost)
	{
		
		const siblingNodes = this.emitPing();
		let map = somePackage.data.hops.map(h => h.node.name);
		let isFinished = this.nodeHasSplitted;
		this.nodeHasSplitted = true;
		console.log(map, "   ", this.name);
		let newPackage = {...this.appendMyInformation(somePackage, wayCost)};
		if (isFinished)
		{
			newPackage = new SimulationPackage(packageType.RETURN_INFORMATION, [newPackage.data], newPackage.data.hops[newPackage.data.hops.length - 2].node);
		}
		if (newPackage.type === packageType.RETURN_INFORMATION)
		{
			this.emitPackage(newPackage);
		}
		else
		// send information package to all siblings
		{
			let nextHops = siblingNodes.filter(n => newPackage.data.hops[newPackage.data.hops.length - 2].name !== n.name);
			
			this.countSplits = nextHops.length;
			if (this.countSplits > 1)
				console.log(`>>>> SPLITS AT ${this.name}`);
			
			nextHops.forEach(node => {
				if (this.countSplits > 1)
					console.log(`>>>> SPLIT AT ${this.name}`);
				const p = new SimulationPackage(newPackage.type, {
					node: {...newPackage.data.node},
					value: newPackage.data.value,
					hops: [...newPackage.data.hops]
				}, node);
				this.emitPackage(p);
				if (this.countSplits > 1)
					
					console.log(`<<<< SPLIT RETURNED AT ${this.name}`);
			});
			if (this.countSplits > 1)
				console.log(`<<<< ALL SPLITS RETURNED AT ${this.name}`);
		}
	}
	
	handlePackage(somePackage)
	{
		if (somePackage.destination.name === this.name)
		{
			console.log(`${this.name} received following package: `, somePackage);
		}
		else
		{
			const newTarget = this.minimalDiscoveredSpanTree.getNextNodeWhenGoing(this, somePackage.destination);
			somePackage.target = newTarget;
			this.emitPackage(somePackage);
		}
	}
	
	// internal
	setNetwork(packageEmitFunc, pingEmitFunc, addReceivedInfo)
	{
		this.network = {
			emitPackage: (somePackage) => packageEmitFunc(this, somePackage),
			emitPing: () => pingEmitFunc(this),
			emitReceivedInformation: (packageMst) => addReceivedInfo(packageMst)
		};
	}
	
	constructor(name, value)
	{
		this.name = name;
		this.value = value;
		this.countSplits = 0;
		this.nodeHasSplitted = false;
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
	// for simulation information
	SimulationContext.prototype.recivedPackageMst = [];
	
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
		nodeContainer.node.setNetwork(this.sendPackage, this.pingSurrounding, this.addReceivedInfo);
		return this.container.push(nodeContainer);
	};
	
	//
	SimulationContext.prototype.addReceivedInfo = (packageMst) => {
		this.recivedPackageMst.push(packageMst);
	};
}


const simulate = (nodes, someLinks, randomIndexOfNodes) => {
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
	
	// let one node start the network indexing process(gets all links and makes mst then pushes mst to other nodes)
	console.log('Node used to discover the network: ', simulationContext.container[randomIndexOfNodes].node);
	simulationContext.container[randomIndexOfNodes].node.sendInformationRequest();
	return simulationContext.__proto__;
};

// run the simulation
