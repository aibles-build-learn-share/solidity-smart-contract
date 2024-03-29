# Prerequisites

- Docker

```shell
PATH+=":./bin"    # use your sh files (which are located in bin/) directly from the root of the project
```

```shell
./build.sh      # install solc and other tools in the docker image
yarn install    # install deps
```

Don't forget to copy the .env.example file to a file named .env, and then edit it to fill in the details.

# Running all the tests

```shell
yarn run test
yarn run test:trace       # shows logs + calls
yarn run test:fresh       # force compile and then run tests
yarn run test:coverage    # run tests with coverage reports
yarn run test:gas         # run tests with gas report
```

# Formatters & Linters

You can use the below packages,

- Solhint
- ESLint
- Prettier
- CSpell
- ShellCheck

```shell
yarn run format
yarn run lint
```

# Analyzers

You can use the below tools,

- Slither
- Mythril

```shell
yarn run analyze:static path/to/contract
yarn run analyze:security path/to/contract
yarn run analyze:all path/to/contract # Currently not working, update later
```

# Deploy Contract & Verification

To try out Etherscan verification, you first need to deploy a contract to an Ethereum network that's supported by Etherscan, such as Ropsten.

In this project, copy the .env.example file to a file named .env, and then edit it to fill in the details.

- Enter your Etherscan API key
- Ropsten node URL (eg from Alchemy)
- The private key of the account which will send the deployment transaction.

With a valid .env file in place, first deploy your contract:

```shell
yarn run deploy ropsten <CONTRACT_FILE_NAME>    # related to scripts/deploy/<CONTRACT_FILE_NAME>.ts
yarn run deploy:all ropsten                     # related to scripts/deploy.ts
```

Also, you can add contract(s) manually to your tenderly projects from the output.
`https://dashboard.tenderly.co/contract/<NETWORK_NAME>/<CONTRACT_ADDRESS>`

And then verify it:

```shell
yarn run verify ropsten <DEPLOYED_CONTRACT_ADDRESS> "<CONSTRUCTOR_ARGUMENT(S)>"    # hardhat.config.ts to see all networks
```

# Miscellaneous

```shell
yarn run generate:docs    # generate docs. it checks to /contracts folder
```

```shell
yarn run generate:flatten path/to/contract    # generate the flatten file
yarn run generate:abi path/to/contract        # generate the ABI file
yarn run generate:bin path/to/contract        # generate the binary in a hex
```

```shell
yarn hardhat convert-evm <EVM_ADDRESS> # convert EVM address to Substrate address for deposit
```
