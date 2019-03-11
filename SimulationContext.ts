import {NodeContainer} from "./NodeContainer";

class SimulationContext1{
    public container: NodeContainer[] = [];
    public receivedMSTPackage: SimulationPackage[] = [];
    private addReceivedMSTPackage = (MSTPackage) => this.receivedMSTPackage.push(MSTPackage);

    public registerNode = (node: SpanningTreeNode, linksOfNode: SpanningTreeLink[]) => {
        let nodeContainer = new NodeContainer(node, linksOfNode);
        nodeContainer.node.setNetwork(this.addReceivedMSTPackage);
        return this.container.push(nodeContainer);
    }
}


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
