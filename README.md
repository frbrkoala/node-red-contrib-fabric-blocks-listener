# node-red-contrib-fabric-blocks-listener
A node that listens to the blocks events in Hyperledger Fabric peer and sends the blocks as JSON objects to output 1 and read/write set from every transaction to output 2.

## How to configure
To configure the node, assign your values to the parameters in the configuration of the node. All params are optional, but make sure you specified correct Peer URL, MSP ID, and channel name. `Start Block` and `EndBlock` params allow you to read a section of the blockchain, starting with, well Start and ending with the end. `Start Block = -1` means we start from the latest block and `EndBlock = 0` means we keep listening for the new blocks. `Disconnect` parameter allows your node to disconnect after the blocks are synced automatically. If it's enabled, the node will stop listening for new blocks arrivals. Please also note: **current version does not support SSL**.

Unfortunately, there is a problem in Node-RED that makes it hard to get the string for User's Private Key and User's certificate from the node configuration, so we are using a workaround and need to have those two items from another node, inside `msg.payload`. I.e., put a simple `inject` node, in configuration use JSON as an option, and add the following JSON (change the private key and cert to yours, of course):
```
{
    "privateKeyPEM": "-----BEGIN PRIVATE KEY-----\nMIGHAgEAnBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgBQYn2CWsKn+LGukB\nJpkuxnqPcIqEWZVccu5eUGJeQqqhRANCAAQ9TAfLG/ynt+PRZWZ/8nq46qYP7WpH\n3l3ryS0gg0Ww4qmL4KChiNDhtMeboS6POkrep8IVh6LNhkVuoIF7St4G\n-----END PRIVATE KEY-----\n",
    
    "signedCertPEM": "-----BEGIN CERTIFICATE-----\nMIICjDCCAjggAwIBAgIUXCP8E3M33FBVBwd9cWSIjS2n2nUwCgYIKoZIzj0EAwIw\nczELMAkGA1UEBhMCVVMxEzARBgNVBAgTCkNhbGlmb3JuaWExFjAUBgNVBAcTDVNh\nbiBGcmFuY2lzY28xGTAXBgNVBAoTEG9yZzEuZXhhbXBsZS5jb20xHDAaBgNVBAMT\nE2NhLm9yZzEuZXhhbXBsZS5jb20wHhcNMTgxMDI1MDMzNzAwWhcNMTkwOTIzMTE0\nMjAwWjA9MRwwDQYDVQQLEwZjbGllbnQwCwYDVQQLEwRvcmcxMR0wGwYDVQQDDBRh\nZG1pbkBidWxsaW9uaXN0LmNvbTBZMBMGByqGSM49AgEGCCqGSM49AwEHA0IABD1M\nB8sb/Ke349FlZn/yerjqpg/takfeXevJLSCDRbDiqYvgoKGI0OG0x5uhLo86St6n\nwhWHos2GRW6ggXtK3gajgdowgdcwDgYDVR0PAQH/BAQDAgIEMAwGA1UdEwEB/wQC\nMAAwHQYDVR0OBBYEFBKzc6wWjSRe1CzCCrKRRgdKlTLYMCsGA1UdIwQkMCKAILfL\nJC41rRVKtFuG5UIX+0Xa/GXzcEMxZeTZ8qHwW0XfMGsGCCoDBAUGBwgBBF97ImF0\ndHJzIjp7ImhmLkFmZmlsaWF0aW9uIjoib3JnMSIsImhmLkVucm9sbG1lbnRJRCI6\nImFkbWluQGJ1bGxpb25pc3QuY29tIiwiaGYuVHlwZSI6ImNsaWVudCJ9fTAKBggq\nhkjOPQQDAgNHADBEAiBfb1CrgSnRkaRhJJbQJps+EoxojiWYPu/e80TRvnH1hAIg\nfYEMkGX1MF9XKv1jPwYXt8noETjzZY7//wBarX2IYH8=\n-----END CERTIFICATE-----\n"
}
```
Good thing is that you can actually store the key and cert in some more secure external storage like a database, and pull it from there and pass to the node.

Also, you can overwrite any/all configuration parameters by sending them to the node in the following format: 
```
{
    "startBlock": 20,
    "peerAddress": "grpc://localhost:7051",
    "username": "admin",
    "mspId": "Org1MSP",
    "channelName": "mychannel",
    
    "privateKeyPEM": "-----BEGIN PRIVATE KEY-----\nMIGHAgEAnBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgBQYn2CWsKn+LGukB\nJpkuxnqPcIqEWZVccu5eUGJeQqqhRANCAAQ9TAfLG/ynt+PRZWZ/8nq46qYP7WpH\n3l3ryS0gg0Ww4qmL4KChiNDhtMeboS6POkrep8IVh6LNhkVuoIF7St4G\n-----END PRIVATE KEY-----\n",
    
    "signedCertPEM": "-----BEGIN CERTIFICATE-----\nMIICjDCCAjggAwIBAgIUXCP8E3M33FBVBwd9cWSIjS2n2nUwCgYIKoZIzj0EAwIw\nczELMAkGA1UEBhMCVVMxEzARBgNVBAgTCkNhbGlmb3JuaWExFjAUBgNVBAcTDVNh\nbiBGcmFuY2lzY28xGTAXBgNVBAoTEG9yZzEuZXhhbXBsZS5jb20xHDAaBgNVBAMT\nE2NhLm9yZzEuZXhhbXBsZS5jb20wHhcNMTgxMDI1MDMzNzAwWhcNMTkwOTIzMTE0\nMjAwWjA9MRwwDQYDVQQLEwZjbGllbnQwCwYDVQQLEwRvcmcxMR0wGwYDVQQDDBRh\nZG1pbkBidWxsaW9uaXN0LmNvbTBZMBMGByqGSM49AgEGCCqGSM49AwEHA0IABD1M\nB8sb/Ke349FlZn/yerjqpg/takfeXevJLSCDRbDiqYvgoKGI0OG0x5uhLo86St6n\nwhWHos2GRW6ggXtK3gajgdowgdcwDgYDVR0PAQH/BAQDAgIEMAwGA1UdEwEB/wQC\nMAAwHQYDVR0OBBYEFBKzc6wWjSRe1CzCCrKRRgdKlTLYMCsGA1UdIwQkMCKAILfL\nJC41rRVKtFuG5UIX+0Xa/GXzcEMxZeTZ8qHwW0XfMGsGCCoDBAUGBwgBBF97ImF0\ndHJzIjp7ImhmLkFmZmlsaWF0aW9uIjoib3JnMSIsImhmLkVucm9sbG1lbnRJRCI6\nImFkbWluQGJ1bGxpb25pc3QuY29tIiwiaGYuVHlwZSI6ImNsaWVudCJ9fTAKBggq\nhkjOPQQDAgNHADBEAiBfb1CrgSnRkaRhJJbQJps+EoxojiWYPu/e80TRvnH1hAIg\nfYEMkGX1MF9XKv1jPwYXt8noETjzZY7//wBarX2IYH8=\n-----END CERTIFICATE-----\n"
}
```

## Node output
The node has two outputs:
 - Through the First, you will get the whole block, received by the node.
 - Through the Second output, you will get the read-write set from every **valid** transaction in the block for all chaincodes.