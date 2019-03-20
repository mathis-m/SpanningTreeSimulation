import {SimulationLink} from "../Simulation/SimulationLink";
import * as DisjointSet from "disjoint";
import {RoutingTableEntry} from "../Simulation/Bridge";

export class MinimalSpanTree {

    // topology
    public shortestLinks: SimulationLink[] = [];
    public allNodes: { name: string, value: number }[] = [];
    public root: { name: string, value: number };

    constructor(spanTreeLinks: SimulationLink[]) {
        // sort links shortest last
        let links = [...spanTreeLinks];
        links = links.sort((a, b) => a.cost - b.cost).reverse();

        const array = links.flatMap(l => l.nodes);
        // find all Nodes
        const map = new Map();
        for (const item of array) {
            if (!map.has(item.name)) {
                map.set(item.name, true);
                this.allNodes.push(item);
            }
        }
        // find root
        this.root = this.allNodes.sort((a, b) => a.value - b.value)[0];
        // find mst using kruskal impl with disjoint set
        this.shortestLinks = this.kruskal(links, links.length);
    }

    // builds routing table for [name], to optimize provide last sender;
    getRoutingTable(name: string, senderOfPkg: string): RoutingTableEntry[] {
        // all nodes as number arr
        const allNodes = this.allNodes.map(node => node.value);
        // all links as number arr
        const links = this.shortestLinks.map(link => link.nodes.map(node => node.value));
        // gets connected nodes of node
        const getConnected = (node: number) => links.filter(l => l.indexOf(node) !== -1).map(l => l.find(n => n !== node));
        // returns arr of all nodes behind [node] excluded those that are behind [exclude]
        const getAllNodesBehind = (node: number, exclude: number) => {
            let ret = [];
            // find connected nodes
            const connNodes = getConnected(node).filter(n => n !== exclude);
            // return connected nodes and those that are connected with that connected nodes
            return [...connNodes, ...connNodes.flatMap(n => getAllNodesBehind(n, node))];
        };

        const buildRoutingTable = (forNode: number, disFavouredNext: number) => {
            let nodes = [...allNodes].filter(n => n !== forNode);
            const res = [];
            const not = forNode;
            const connNodes = getConnected(forNode).filter(n => n !== disFavouredNext);
            connNodes.forEach(node => {
                res.push({target: node, nextHop: node});
                const temp = getAllNodesBehind(node, not);
                temp.forEach(n => res.push({target: n, nextHop: node}));
                nodes = nodes.filter(n => n !== node && temp.indexOf(n) === -1);
            });
            nodes.forEach(n => res.push({target: n, nextHop: disFavouredNext}));
            return res;
        };
        return buildRoutingTable(this.allNodes.find(n => n.name === name).value, this.allNodes.find(n => n.name === senderOfPkg).value)
            .map(e => {
                console.log(e);
                return ({
                target: this.allNodes.find(n => n.value === e.target).name,
                nextHop: this.allNodes.find(n => n.value === e.nextHop).name
            })});
    }

    private kruskal(links: SimulationLink[], n: number): SimulationLink[] {
        // make new disjoint set with size of nodes count
        const linkSet = new DisjointSet(this.allNodes.length);
        // util
        const getIndexes = (link) => link.nodes.map(no => this.allNodes.findIndex(node => node.name === no.name));
        // so far shortest links without loop
        const mstLinks: SimulationLink[] = [];
        while (links.length > 0) {
            const link = links.pop();
            if (!linkSet.isConnected(...getIndexes(link))) {
                linkSet.union(...getIndexes(link));
                mstLinks.push(link);
            }
        }
        return mstLinks;
    }

    // for view
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
