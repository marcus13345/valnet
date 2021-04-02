const EventEmitter = require('events')
const stp = require('./STP');
const upnp = require('./upnp');
const md5 = require('md5');
const pkg = require('./../package.json');
const { config, write } = require('./config.js');
const log = require('signale').scope('NODE');
const bonjour = require('bonjour')();
const Gateway = require('./Gateway');

class Node extends EventEmitter {
	clients = [];
	hash = null;
	name = null;
	readyPromise = null;
	port = null;
	identity;
	multicastAd = null;
	multicastBrowser = null;
	connected = false;
	multicastDevices = [];
	
	constructor(identity) {
		super();
		this.identity = identity;
		this.hash = md5(identity.publicKey);
		this.name = `valnet-node-${identity.name}`;

		this.readyPromise = this.negotiatePort()
			.then(this.startServer.bind(this))
			.catch(this.serverStartupFailed.bind(this))
			.then(this.connectNetwork.bind(this))
	}

	async connectNetwork() {
		const gateway = new Gateway(this.identity, config.endpoints);
	}

	async serverStartupFailed(error) {
		log.warn('Failed to set up Valet server on node.')
	}

	async startServer() {
		log.info('creating Valnet Node on port ' + this.port + '...');

		stp.createServer({
			identity: this.identity,
			port: this.port
		}, (connection) => {
			log.info('incomming connection from ' + connection.remoteName);
		});
		
		log.info('advertising node on multicast...')
		this.multicastAd = bonjour.publish({
			name: this.name,
			type: 'stp',
			port: this.port,
			protocol: 'tcp'
		});

		this.multicastBrowser = bonjour.find({type: 'stp'});

		this.multicastBrowser.on('up', this.serviceUp.bind(this));
		this.multicastBrowser.on('down', this.serviceDown.bind(this));

		// log.success('Node successfully registered!');
	}

	async serviceUp(device) {
		this.multicastDevices.push(device);
	}

	async serviceDown(device) {
		this.multicastDevices = this.multicastDevices.filter(testDevice => {
			return testDevice.host !== device.host
					|| testDevice.port !== device.port
		})
	}

	async negotiatePort() {
		const mappings = await upnp.mappings();
		const matchingMappings = mappings.filter(mapping => {
			return mapping.description === this.name
		});
		const alreadyMapped = matchingMappings.length > 0;
		const takenPorts = mappings.map(mapping => mapping.public.port);

		if(alreadyMapped) {
			this.port = matchingMappings[0].public.port;
			log.success(`upnp port ${this.port} already registered!`);
			return;
		}

		for(let port = config.ports.relay; port <= config.ports.relayEnd; port ++) {
			if(takenPorts.indexOf(port) === -1) {
				await upnp.mapIndefinite(port, this.name);
				this.port = port;
				log.success(`registered upnp port ${this.port}`);
				return;
			}
		}

		// console.log(mappings, this.hash);
	}

	static get Node() {
		return Node;
	}

	get ready() {
		return this.readyPromise;
	}
}


module.exports = Node;