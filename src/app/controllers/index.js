const urls = require( '../lib/urls' );
const backend = require( '../lib/backend-service' );
const dashboardViewModel = require( '../view-models/dashboard' );
const { transformFilterValue } = require( '../lib/barrier-filters' );

const sortData = {
	fields: [ 'priority', 'date', 'location', 'status', 'updated' ],
	directions: [ 'asc', 'desc' ],
	serviceParamMap: {
		date: 'reported_on',
		location: 'export_country',
		updated: 'modified_on',
	},
};

function getCurrentSort( { sortBy, sortDirection } ){

	const field = ( sortData.fields.includes( sortBy ) ? sortBy : 'updated' );

	return {
		field,
		serviceParam: ( sortData.serviceParamMap[ field ] || field ),
		direction: ( sortData.directions.includes( sortDirection ) ? sortDirection : 'desc' ),
	};
}

module.exports = {

	index: async ( req, res, next ) => {

		const currentSort = getCurrentSort( req.query );
		const userProfile = req.user.user_profile || {};

		if( !userProfile.watchList ){

			res.render( 'index' );

		} else {

			const watchListFilters = Object.entries( userProfile.watchList.filters ).map( ( [ key, value ] ) => ({ key, value: transformFilterValue( key, value ) }) );

			try {

				const { response, body } = await backend.barriers.getAll( req, userProfile.watchList.filters, currentSort.serviceParam, currentSort.direction );

				if( response.isSuccess ){

					res.render('index', dashboardViewModel(
						body.results,
						{ ...sortData, currentSort },
						true,
						watchListFilters,
						userProfile.watchList.filters,
					));

				} else {

					throw new Error( `Got ${ response.statusCode } response from backend` );
				}

			} catch( e ){

				next( e );
			}
		}
	},

	me: ( req, res ) => {

		if( req.method === 'POST' ){

			delete req.session.user;
			res.redirect( urls.me() );

		} else {

			res.render( 'me', { csrfToken: req.csrfToken() } );
		}
	},

	documents: {
		download: async ( req, res, next ) => {

			const documentId = req.params.uuid;

			try {

				const { response, body } = await backend.documents.download( req, documentId );

				if( response.isSuccess && body.document_url ){

					res.redirect( body.document_url );

				} else {

					next( new Error( 'Unable to get document download link' ) );
				}

			} catch( e ){

				next( e );
			}
		},
	}
};
