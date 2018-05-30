const supertest = require( 'supertest' );
const proxyquire = require( 'proxyquire' );
const winston = require( 'winston' );
const nock = require( 'nock' );

const config = require( '../../../app/config' );
const urls = require( '../../../app/lib/urls' );
const logger = require( '../../../app/lib/logger' );
const modulePath = '../../../app/app';

const getFakeData = require( '../helpers/get-fake-data' );

function getTitle( res ){

	const text = res.text;
	const openTag = '<title>';
	const openTagIndex = text.indexOf( openTag );
	const closeTagIndex = text.indexOf( '</title>', openTagIndex );
	const title = text.substring( ( openTagIndex + openTag.length ), closeTagIndex );

	return title;
}

function checkResponse( res, statusCode ){

	const headers = res.headers;

	if( res.statusCode != statusCode ){
		console.log( res.text );
	}

	expect( res.statusCode ).toEqual( statusCode );
	expect( headers[ 'x-download-options' ] ).toBeDefined();
	expect( headers[ 'x-xss-protection' ] ).toBeDefined();
	expect( headers[ 'x-content-type-options' ] ).toBeDefined();
	expect( headers[ 'x-frame-options' ] ).toBeDefined();
	expect( headers[ 'cache-control' ] ).toEqual( 'no-cache, no-store' );
}

describe( 'App', function(){

	let app;
	let oldTimeout;

	beforeAll( function(){

		logger.remove( winston.transports.Console );
		oldTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
		jasmine.DEFAULT_TIMEOUT_INTERVAL = 500;
	} );

	afterAll( function(){

		logger.add( winston.transports.Console );
		jasmine.DEFAULT_TIMEOUT_INTERVAL = oldTimeout;
	} );

	describe( 'Pages', function(){

		beforeAll( function(){

			app = supertest( proxyquire( modulePath, {
				'morgan': function(){ return function ( req, res, next ){ next(); }; },
				'./config': {
					isDev: true
				}
			} ).create() );
		} );

		describe( 'index page', function(){

			it( 'Should render the index page', function( done ){

				app.get( urls.index() ).end( ( err, res ) => {

					checkResponse( res, 200 );
					expect( getTitle( res ) ).toEqual( 'Market Access - Homepage' );
					done();
				} );
			} );
		} );

		describe( 'Report a barrier', () => {

			describe( 'Index page', () => {
			
				it( 'Should render the index page', ( done ) => {
			
					app.get( urls.report.index() ).end( ( err, res ) => {

						checkResponse( res, 200 );
						expect( getTitle( res ) ).toEqual( 'Market Access - Report a barrier' );
						done();
					} );
				} );
			} );
		
			describe( 'Start page', () => {
			
				it( 'Should render the start page', ( done ) => {
			
					app.get( urls.report.start() ).end( ( err, res ) => {

						checkResponse( res, 200 );
						expect( getTitle( res ) ).toEqual( 'Market Access - Report - Status of the problem' );
						done();
					} );
				} );
			} );

			describe( 'Company search page', () => {
			
				it( 'Should render the company search page', ( done ) => {
			
					app.get( urls.report.company() ).end( ( err, res ) => {

						checkResponse( res, 200 );
						expect( getTitle( res ) ).toEqual( 'Market Access - Report - Search for company' );
						done();
					} );
				} );
			} );

			describe( 'Company detail', () => {

				let companyId;

				beforeEach( () => {
				
					companyId = 'd829a9c6-cffb-4d6a-953b-3e02a2b33028';

					nock( config.datahub.url )
						.get( `/v3/company/${ companyId }` )
						.reply( 200, getFakeData( '/datahub/company/detail' ) );
				} );

				afterEach( () => {
				
					expect( nock.isDone() ).toEqual( true );
				} );
			
				it( 'Should render the details of a company', ( done ) => {
			
					app.get( urls.report.company( companyId ) ).end( ( err, res ) => {

						checkResponse( res, 200 );
						expect( getTitle( res ) ).toEqual( 'Market Access - Report - Company details' );
						done();
					} );
				} );
			} );
		} );

		describe( '404 page', function(){

			it( 'Should render the 404 page', function( done ){

				app.get( '/abc123' ).end( ( err, res ) => {

					checkResponse( res, 404 );
					expect( getTitle( res ) ).toEqual( 'Market Access - Not found' );
					done();
				} );
			} );
		} );

		describe( 'Ping', function(){

			it( 'Should return a status of 200', function( done ){

				app.get( '/ping/' ).end( ( err, res ) => {

					checkResponse( res, 200 );
					done();
				} );
			} );
		} );

		describe( 'Login', () => {
		
			it( 'Should redirect to the sso page', ( done ) => {
		
				app.get( urls.login() ).end( ( err, res ) => {

					checkResponse( res, 302 );
					expect( res.headers.location ).toBeDefined();
					done();
				} );
			} );
		} );

		describe( 'Login callback', () => {
		
			it( 'Should redirect to the login page', ( done ) => {
		
				app.get( '/login/callback/' ).end( ( err, res ) => {

					checkResponse( res, 302 );
					done();
				} );
			} );
		} );
	} );

	describe( 'Environments', function(){

		let morgan;
		let disable;
		let compression;
		let express;
		let use;
		let ssoBypass;
		let auth;

		beforeEach( function(){

			morgan = jasmine.createSpy( 'morgan' );
			compression = jasmine.createSpy( 'compression' );
			disable = jasmine.createSpy( 'app.disable' );
			use = jasmine.createSpy( 'app.use' );
			ssoBypass = jasmine.createSpy( 'sso-bypass' );
			auth = jasmine.createSpy( 'auth' );

			express = function(){
				return {
					disable,
					use,
					set: jasmine.createSpy( 'app.set' ),
					get: jasmine.createSpy( 'app.get' ),
					post: jasmine.createSpy( 'app.post' ),
					param: jasmine.createSpy( 'app.param' )
				};
			};
		} );

		function usesMiddleware( fn ){

			const l = use.calls.count();
			let i = 0;

			for( ; i < l; i++ ){

				if( use.calls.argsFor( i )[ 0 ] == fn ){

					return true;
				}
			}

			return false;
		}

		describe( 'Dev mode', function(){

			it( 'Should setup the app in dev mode', function(){

				const app = proxyquire( modulePath, {
					'./config': { isDev: true },
					'morgan': morgan,
					'compression': compression,
					'express': express,
					'./middleware/sso-bypass': ssoBypass,
					'./middleware/auth': auth
				} );

				app.create();

				expect( morgan ).toHaveBeenCalledWith( 'dev' );
				expect( compression ).not.toHaveBeenCalled();
				expect( disable ).toHaveBeenCalledWith( 'x-powered-by' );
				expect( usesMiddleware( ssoBypass ) ).toEqual( true );
				expect( usesMiddleware( auth ) ).toEqual( true );
			} );
		} );

		describe( 'Prod mode', function(){

			it( 'Should setup the app in prod mode', function(){

				const app = proxyquire( modulePath, {
					'./config': { isDev: false },
					'morgan': morgan,
					'compression': compression,
					'express': express,
					'./middleware/auth': auth
				} );

				app.create();

				expect( morgan ).toHaveBeenCalledWith( 'combined' );
				expect( compression ).toHaveBeenCalled();
				expect( disable ).toHaveBeenCalledWith( 'x-powered-by' );
				expect( usesMiddleware( ssoBypass ) ).toEqual( false );
				expect( usesMiddleware( auth ) ).toEqual( true );
			} );
		} );
	} );
} );
