import {SimulationLink} from "../Simulation/SimulationLink";

export class MinimalSpanTree {
    public shortestLinks: SimulationLink[] = [];
    public allNodes: { name: string, value: number }[] = [];
    public root: { name: string, value: number };

    allNodesAreConnected(allNodes, shortestLinks = this.shortestLinks) {
        const result = [];
        const array = shortestLinks.flatMap(l => l.nodes);
        const map = new Map();
        for (const item of array) {
            if (!map.has(item.name)) {
                map.set(item.name, true);
                result.push(item);
            }
        }
        let allNodesAreIncluded = result.length === allNodes.length;
        let allNodesAreConnected;
        if (allNodesAreIncluded) {
            let nodesToFind = [...this.allNodes];
            const allFound = () => nodesToFind.length === 0;
            const getDirectConnected = (node) => shortestLinks
                .filter(link => link.nodes.findIndex(n => n.name === node.name) !== -1)
                .flatMap(link => link.nodes.find(n => n.name !== node.name))
                .filter(n => nodesToFind.findIndex(n1 => n1.name === n.name) !== -1);
            const removeNode = (node) => nodesToFind.splice(nodesToFind.findIndex(n => n.name === node.name), 1);
            const traverse = (currentNode) => {
                removeNode(currentNode);
                const connected = getDirectConnected(currentNode);
                connected.forEach(next => traverse(next));
            };
            traverse(this.root);
            allNodesAreConnected = allFound();
        }
        return allNodesAreIncluded && allNodesAreConnected;
    };

    constructor(spanTreeLinks: SimulationLink[]) {

        let links = [...spanTreeLinks];
        links = links.sort((a, b) => a.cost - b.cost).reverse();

        const array = links.flatMap(l => l.nodes);

        const map = new Map();
        for (const item of array) {
            if (!map.has(item.name)) {
                map.set(item.name, true);
                this.allNodes.push(item);
            }
        }
        this.root = this.allNodes.sort((a, b) => a.value - b.value)[0];
        console.log([...links]);
        while (!this.allNodesAreConnected(this.allNodes)) {
            let items = links.pop();
            this.shortestLinks.push(items);
            if(this.allNodesAreConnected(this.allNodes)){
                let temp, last = temp = [...this.shortestLinks];
                while(!!temp){
                    last = temp;
                    temp = this.tryToRemove(temp);
                }
                if(last.length < this.shortestLinks.length){
                    this.shortestLinks = last;
                }
            }
        }
        console.log(this.shortestLinks);
    }
    private tryToRemove(shortestLinks){
        let res;
        for (const l of shortestLinks) {
            let simulationLinks = [...shortestLinks];
            simulationLinks.splice(simulationLinks.findIndex(link => link === l),1);
            if(this.allNodesAreConnected(this.allNodes, simulationLinks)){
                res = simulationLinks;
                break;
            }
        }
        return res;
    }

    linkToString() {
        const sorted = this.shortestLinks.map(link => {
            return new SimulationLink(link.nodes.sort((a, b) => {
                    if (a.name < b.name) {
                        return -1;
                    }
                    if (a.name > b.name) {
                        return 1;
                    }
                    return 0;
                }), link.cost
            );
        }).sort((a, b) => {
            if (a.nodes[0].name < b.nodes[0].name) {
                return -1;
            }
            if (a.nodes[0].name > b.nodes[0].name) {
                return 1;
            }
            if (a.nodes[0].name === b.nodes[0].name) {
                if (a.nodes[1].name < b.nodes[1].name) {
                    return -1;
                }
                if (a.nodes[1].name > b.nodes[1].name) {
                    return 1;
                }
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
