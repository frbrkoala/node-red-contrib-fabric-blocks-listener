module.exports = function (RED) {
    const Fabric_Client = require('fabric-client');

    async function main(node) {
        const fabric_client = new Fabric_Client();

        const flowContext = node.context().flow;

        const peerAddress = flowContext.get("fbl.peerAddress");
        const username = flowContext.get("fbl.username");
        const mspId = flowContext.get("fbl.mspId");
        const privateKeyPEM = flowContext.get("fbl.privateKeyPEM");
        const signedCertPEM = flowContext.get("fbl.signedCertPEM");
        const channelName = flowContext.get("fbl.channelName");

        // setup the fabric network
        const channel = fabric_client.newChannel(channelName);
        const peer = fabric_client.newPeer(peerAddress);
        channel.addPeer(peer);


        const member_user = null;
        const tx_id = null;

        await initUser(fabric_client, username, mspId, privateKeyPEM, signedCertPEM);
        await registerBlockEventListener(peer, channel, node);
    }

    async function initUser(fabric_client, username, mspId, privateKeyPEM, signedCertPEM) {
        const cryptoContent = {
            privateKeyPEM: privateKeyPEM,
            signedCertPEM: signedCertPEM
        }
        const opts = {
            "username": username,
            "mspid": mspId,
            "cryptoContent": cryptoContent,
            "skipPersistence": true
        }
        await fabric_client.createUser(opts);
    }


    function logBlock(block, node) {
        console.log('Successfully received the block event');
        // Block structure doc at https://blockchain-fabric.blogspot.com/2017/04/hyperledger-fabric-v10-block-structure.html
        const blockNumber = block.header.number;

        const flowContext = node.context().flow;
        flowContext.set("fbl.latestBlock", blockNumber);

        let validationCode = block.metadata.metadata[2]
        // if (validationCode === 0) {
        //     validationCode = 'VALID';
        // }

        const transactionArray = block.data.data
        transactionArray.forEach((transaction) => {
            const channelHeader = transaction.payload.header.channel_header;
            const txId = channelHeader.tx_id;
            const type = channelHeader.type;
            const ENDORSER_TRANSACTION = 3;
            const VALID_CODE = 0;

            //blockLog = `blockNumber[${blockNumber}] validationCode[${validationCode}] txId[${txId}] type[${type}] \n`;

            //console.log(blockLog);
            node.send([{
                payload: block
            }]);


            if (type == ENDORSER_TRANSACTION && validationCode == VALID_CODE) {
                const transactionAction = transaction.payload.data.actions[0];
                const chaincodeEndorsedAction = transactionAction.payload.action;
                const txReadWriteSet = chaincodeEndorsedAction.proposal_response_payload.extension.results;

                //const transactionLog = `txReadWriteSet[${JSON.stringify(txReadWriteSet, null, 0)}] \n`;
                //console.log(transactionLog);
                node.send([{}, {
                    payload: txReadWriteSet
                }]);
            }
        });
    }


    function registerBlockEventListener(peer, channel, node) {
        const channel_event_hub = channel.newChannelEventHub(peer);

        const flowContext = node.context().flow;

        const startBlock = flowContext.get("fbl.startBlock");
        const endBlock = flowContext.get("fbl.endBlock");
        const disconnect = flowContext.get("fbl.disconnect");

        // for block listeners, the defaults for unregister and disconnect are true,
        // so the they are not required to be set in the following example
        let listnerConfig = {
            startBlock: startBlock,
            endBlock: endBlock,
            //unregister: true,
            disconnect: disconnect
        }

        if (startBlock == -1) {
            delete(listnerConfig.startBlock);
        }

        if (endBlock == 0) {
            delete(listnerConfig.endBlock);
        }

        // keep the block_reg to unregister with later if needed
        const block_reg = channel_event_hub.registerBlockEvent(
            (block) => {
                node.status({
                    fill: "green",
                    shape: "dot",
                    text: "connected"
                });
                logBlock(block, node);
            },
            (error) => {
                console.error('Failed to receive the block event ::' + error);
                node.status({
                    fill: "red",
                    shape: "ring",
                    text: "disconnected"
                });
            },
            listnerConfig
        );
        channel_event_hub.connect(true);
        if (channel_event_hub.isconnected()) {
            node.status({
                fill: "green",
                shape: "dot",
                text: "connected"
            });
        } else {
            node.status({
                fill: "red",
                shape: "ring",
                text: "disconnected"
            });
        }
    }


    function FabricBlocksListenerNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        const flowContext = node.context().flow;
        flowContext.set("fbl.peerAddress", config.peerAddress);
        flowContext.set("fbl.username", config.username);
        flowContext.set("fbl.mspId", config.mspId);
        flowContext.set("fbl.privateKeyPEM", config.privateKeyPEM);
        flowContext.set("fbl.signedCertPEM", config.signedCertPEM);
        flowContext.set("fbl.channelName", config.channelName);

        flowContext.set("fbl.startBlock", config.startBlock);
        flowContext.set("fbl.endBlock", config.endBlock);
        flowContext.set("fbl.disconnect", config.disconnect);

        console.log(config);
        console.log(flowContext.get("fbl.latestBlock"));

        node.on('input', function (msg) {
            if (typeof msg.payload.startBlock === "number") {
                flowContext.set("fbl.startBlock", msg.payload.startBlock);
            }
            if (typeof msg.payload.endBlock === "number") {
                flowContext.set("fbl.endBlock", msg.payload.endBlock);
            }
            if (msg.payload.peerAddress) {
                flowContext.set("fbl.peerAddress", msg.payload.peerAddress);
            }
            if (msg.payload.username) {
                flowContext.set("fbl.username", msg.payload.username);
            }
            if (msg.payload.mspId) {
                flowContext.set("fbl.mspId", msg.payload.mspId);
            }
            if (msg.payload.privateKeyPEM) {
                flowContext.set("fbl.privateKeyPEM", msg.payload.privateKeyPEM);
            }
            if (msg.payload.signedCertPEM) {
                flowContext.set("fbl.signedCertPEM", msg.payload.signedCertPEM);
            }
            if (msg.payload.channelName) {
                flowContext.set("fbl.channelName", msg.payload.channelName);
            }
            if (typeof msg.payload.disconnect === "boolean") {
                flowContext.set("fbl.disconnect", msg.payload.disconnect);
            }
            main(node);
            //node.send(msg);
        });
    }
    RED.nodes.registerType("fabric-blocks-listener", FabricBlocksListenerNode);
}