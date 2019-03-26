const uuid = require( 'uuid/v4' );

if( typeof jasmine !== 'undefined' ){

	jasmine.helpers = jasmine.helpers || {};

	const mocks = {

		res: () => ({
			redirect: jasmine.createSpy( 'res.redirect' ),
			render: jasmine.createSpy( 'res.render' ),
			locals: {},
			status: jasmine.createSpy( 'res.status' ),
			json: jasmine.createSpy( 'res.json' ),
		}),

		req: () => ({
			method: 'GET',
			query: {},
			session: {},
			params: {},
			user: {},
			body: {},
			error: jasmine.createSpy( 'req.error' ),
			hasErrors: jasmine.createSpy( 'req.hasErrors' ),
			flash: jasmine.createSpy( 'req.flash' ),
		}),

		next: () => jasmine.createSpy( 'next' ),
	};

	jasmine.helpers.mocks = {

		...mocks,

		middleware: () => {

			const csrfToken = uuid();

			return {
				res: mocks.res(),
				req: {
					...mocks.req(),
					csrfToken: () => csrfToken,
				},
				next: mocks.next(),
				csrfToken,
			};
		},

		reporter: () => ({
			message: jasmine.createSpy( 'reporter.message' ),
			captureException: jasmine.createSpy( 'reporter.captureException' ),
		})
	};
}
