import {SimulationLink} from "../Simulation/SimulationLink";

export class MinimalSpanTree {
	public shortestLinks: SimulationLink[] = [];
	public allNodes: {name: string, value: number}[] = [];
	public root: {name: string, value: number};
	getNextNodeWhenGoing(from, to)
	{
		let nextStep = this.getNextStep(from, to);
		return nextStep;
	}

	getNextStep(from, to, possibleRet?, lastFrom?)
	{
		if (from.name === to.name)
		{
			return possibleRet;
		}
		let nodes = this.shortestLinks.filter(l => l.nodes.findIndex(n => n.name === from.name) !== -1)
						.map(siblingLink => siblingLink.nodes.find(n => n.name !== from.name)).filter(n => !lastFrom ? true : n.name !== lastFrom);
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
				result.push(name);
			}
		}
		let allNodesAreIncluded = result.length === allNodes.length;
		let allNodesAreConnected = true;
		if (allNodesAreIncluded)
			for (const item of this.allNodes)
			{
				if (item.name !== this.root.name)
				{
					if (!this.getNextNodeWhenGoing(this.root, name))
					{
						allNodesAreConnected = false;
						break;
					}
				}
			}
		return allNodesAreIncluded && allNodesAreConnected;
	};

	constructor(spanTreeLinks: SimulationLink[])
	{

		let links = [...spanTreeLinks];
		links = links.sort((a, b) => a.cost - b.cost).reverse();

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
	}

	linkToString()
	{
		const sorted = this.shortestLinks.map(link => {
			return new SimulationLink(link.nodes.sort((a, b) => {
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
