class AdministrationUserForm extends ValidateChangesFormDialog {
	beforeRender() {
		this.data ??= {};
		this.submitText =  i18n._(this.data.id ? 'save' :'add_user');
		this.title =  i18n._(this.data.id ? 'edit_user' : 'add_user');
		this.allowCloseButton = true;
	}

	updateActiveField(active) {
		const binarySwitch = this.form.children.find(ch => ch.name === 'active')
		binarySwitch.textContent = i18n._('user_is') + i18n._(active ? 'active' : 'deactivated');
	}

	renderActivnessField(active) {
		return {
			class: BinarySwitchField,
			label: i18n._('user_is') + i18n._(active ? 'active' : 'deactivated'),
			'on:change': () => this.updateActiveField(!active),
			name: 'active',
			value: active
		};
	}

	getFormFields() {
		return [this.renderActivnessField(this.data.id ? this.data.active : true), {
			nodeName: 'h5',
			textContent: i18n._('user_info')
		},{
			name: 'role',
			label: i18n._('role'),
			class: SelectField,
			value: this.data.role,
			defaultValue: this.data.role || 'EDITOR',
			options: [{
				value: 'EDITOR',
				text: i18n._('editor')
			},{
				value: 'ADMIN',
				text: i18n._('admin')
			}]
		},{
			class: TextField,
			name: 'name',
			label: i18n._('name'),
			autocomplete: 'given-name',
			value: this.data.name
		},{
			class: TextField,
			name: 'surname',
			label: i18n._('lastname'),
			autocomplete: 'family-name',
			value: this.data.surname
		},{
			class: TextField,
			name: 'email',
			label: i18n._('email_address'),
			autocomplete: 'username',
			value: this.data.email
		},{
			nodeName: 'h5',
			textContent: i18n._('change_password')
		},{
			class: PasswordTextField,
			name: 'password',
			required: !this.data.id,
			label: i18n._('password'),
			autocomplete: 'new-password'
		}]
	}

	async onSave(user) {
		const userCreated = await REST.POST(!this.data?.id ? 'users/create' : `users/user-edit/${this.data.id}`, user);

		this.fire('success', userCreated);
	}

	handleError(ex) {
		NOTIFICATION.showStandardizedError({
			404: i18n._('role_not_found'),
			409: i18n._('username_is_already_taken')
		}[ex.status]);
	}
}

class UsersSection extends Sword {
	async render() {
		const me = this;

		this.el = this.createElement({
			className: 'panel-container',
			children: [{
				className: 'header',
				children: [{
					nodeName: 'h4',
					textContent: i18n._('users')
				},{
					nodeName: 'button',
					type: 'button',
					children: ['icon:plus', {textContent: i18n._('add_user')}],
					className: 'primary icon-left',
					'on:click': () => new AdministrationUserForm(document.body, {
						'on:success': (obj, user) => {
							me.users.push(user);
							me.table.setData(me.users);
						}
					})
				}]
			},{
				class: SmartTable,
				ref: 'table',
				getColumns: () => {
					return [{
						name: i18n._('user'),
						formatCell(table, td, v, row) {
							td.textContent = row.name + ' ' + row.surname;
							td.classList.toggle('text-muted', !row.active);
						},
					}, {
						name: i18n._('role'),
						id: 'role',
						formatCell(table, td, v, row) {
							table.append({
								textContent: v.charAt(0) + v.slice(1).toLowerCase(),
								className: 'tag tag-' + v.toLowerCase(),
							}, null, td);
						},
					},{
						name: i18n._('state'),
						id: 'active',
						formatCell(table, td, v, row) {
							table.append({
								children: [table.useIcon(row.active ? 'check' : 'cross'), {textContent: i18n._(row.active ? 'active_capital' : 'deactivated_capital')}],
								className: 'tag ' + ( row.active ? 'tag-active' : 'tag-inactive' ),
							}, null, td);
						}
					}, {
						id: 'ctl',
						formatCell(table, td, v, row) {
							table.append({
								nodeName: 'button',
								type: 'button',
								children: [table.useIcon('pencil')],
								className: 'secondary icon-only small',
								title: i18n._('edit'),
								'on:click': () => new AdministrationUserForm(document.body, {
									data: row,
									'on:success': (obj, user) => {
										const idx = me.users.findIndex(u => u.id === user.id);
										me.users[idx] = user;
										me.table.setData(me.users);
									}
								})
							}, null, td);
						}
					}]
				}
			}]
		}, this);

		this.users = await REST.GET('users/list?role=EDITOR&role=ADMIN');
		this.table.setData(this.users);
	}
}


class LanguageAdministrationForm extends ValidateChangesFormDialog {
	beforeRender() {
		this.data ??= {};
		this.submitText =  i18n._(this.data.id ? 'save' :'add_language');
		this.title =  i18n._(this.data.id ? 'edit_language' : 'add_language');
		this.allowCloseButton = true;
	}

	getFormFields() {
		return [{
			class: TextField,
			name: 'name',
			label: i18n._('name'),
			value: this.data.name,
			autofocus: true
		},{
			class: TextField,
			name: 'code',
			label: i18n._('code'),
			value: this.data.code,
			maxLength: 4
		}]
	}

	async onSave(lang) {
		const language = await REST[this.data?.id ? 'PUT' : 'POST'](`languages${!this.data?.id ? '' : '/' + this.data.id}`, lang);

		this.fire('success', language);
	}

	handleError(ex) {
		let msg = {
			404: i18n._('language_not_found')
		}[ex.status]

		if (ex.status === 409) {
			msg = ex.code === 'lang_name' ? i18n._('language name is already taken') : i18n._('language code is already taken');
		}

		NOTIFICATION.showStandardizedError(msg);
	}
}

class LanguagesSection extends Sword {
	async render() {
		const me = this;

		this.el = this.createElement({
			className: 'panel-container',
			children: [{
				className: 'header',
				children: [{
					nodeName: 'h4',
					textContent: i18n._('languages')
				},{
					nodeName: 'button',
					type: 'button',
					children: ['icon:plus', {textContent: i18n._('add_language')}],
					className: 'primary icon-left',
					'on:click': () => new LanguageAdministrationForm(document.body, {
						'on:success': (obj, lang) => {
							me.languages.push(lang);
							me.table.setData(me.languages);
						}
					})
				}]
			},{
				class: SmartTable,
				ref: 'table',
				getColumns: () => {
					return [{
						name: i18n._('name'),
						id: 'name'
					}, {
						name: i18n._('code'),
						id: 'code'
					},{
						id: 'ctl',
						formatCell(table, td, v, row) {
							table.append(table.createEditButton(LanguageAdministrationForm, row), null, td);
						}
					}]
				}
			}]
		}, this);

		this.languages = await REST.GET('languages/list');
		this.table.setData(this.languages);
	}
}

class AdventureAdministrationFrom extends ValidateChangesFormDialog {
	beforeRender() {
		this.data ??= {};
		this.submitText =  i18n._('save');
		this.title =  i18n._(this.data.id ? 'edit_adventure' : 'create_adventure');
		this.allowCloseButton = true;
	}

	getFormFields() {
		return [{
			class: TextField,
			name: 'name',
			label: i18n._('name'),
			value: this.data?.name,
			autofocus: true
		}, {
			class: TextField,
			name: 'description',
			label: i18n._('description'),
			value: this.data?.description
		}, {
			class: SelectField,
			value: this.data?.language,
			name: 'language',
			label: i18n._('language'),
			options: Utils.convertArrayToOptions(DataManager.languages, 'id', 'name'),
			defaultValue: DataManager.languages[0].id
		}]
	}

	async onSave(data) {
		const id = this.data?.id
		const adventure = await REST[id ? 'PUT' : 'POST'](`adventures${id ? '/' + id : ''}`, data);
		this.fire('success', adventure);
	}

	handleError(ex) {
		NOTIFICATION.showStandardizedError({
			404: i18n._('Adventure not found')
		}[ex.status]);
	}
}

class AdventureModeStateDialog extends ValidateChangesFormDialog {
	beforeRender() {
		this.title = i18n._('Course state');
		this.subtitle = i18n._(`Changing course state will affect all users doing this course. Change it carefully.`)
		this.allowCloseButton = true;
		this.data = {
			state: this.state
		};
	}

	getButtons() {
		return [{
			nodeName: 'button',
			type: 'button',
			className: 'secondary',
			textContent: i18n._('cancel')
		},{
			nodeName: 'button',
			type: 'submit',
			className: 'primary ' + this.submitButtonExtraClass,
			textContent: i18n._('save')
		}]
	}

	getFormFields() {
		return [{
			label: i18n._('state'),
			class: CourseStateSelect,
			name: 'state',
			value: this.state
		}]
	}

	async onSave(data) {
		if (data.state !== 'creating') {
			const course = await REST.POST(`adventures/${this.id}/state`, data);
			this.fire('success', course);
		}
	}

	handleError(ex) {
		NOTIFICATION.showStandardizedError({
			404: i18n._('Adventure not found')
		}[ex.status]);
	}
}

class AdventuresSection extends Sword {
	async render() {
		const me = this;

		this.el = this.createElement({
			className: 'panel-container',
			children: [{
				className: 'header',
				children: [{
					nodeName: 'h4',
					textContent: i18n._('adventures')
				},{
					nodeName: 'button',
					type: 'button',
					children: ['icon:plus', {textContent: i18n._('add_adventure')}],
					className: 'primary icon-left',
					'on:click': async () => new AdventureAdministrationFrom(document.body, {
						'on:success': (obj, adventure) => {
							me.adventures.push(adventure);
							me.table.setData(me.adventures);
						}
					})
				}]
			},{
				class: SmartTable,
				ref: 'table',
				getColumns: () => {
					return [{
						name: i18n._('w_name'),
						id: 'name'
					}, {
						name: i18n._('description'),
						id: 'description'
					},{
						name: i18n._('language'),
						id: 'language',
						formatCell(table, td, v, row) {
							td.textContent = DataManager.languageMap[v];
						}
					},{
						name: i18n._('state'),
						id: 'state'
					},{
						id: 'ctl',
						formatCell(table, td, v, row) {
							table.append(table.createEditButton(AdventureAdministrationFrom, row), null, td);
							table.append({
								nodeName: 'button',
								type: 'button',
								children: ['icon:pencil', {textContent: i18n._('change_state')}],
								className: 'primary icon-left',
								'on:click': () => new AdventureModeStateDialog(document.body, {
									id: row.id,
									state: row.state,
									'on:success': (obj, adventure) => {
										if (adventure) {
											me.adventures.updateByIndex(adventure, a => a.id === row.id);
											me.table.setData(me.adventures);
										}
									}
								})
							}, null, td);

							table.append({
								nodeName: 'button',
								type: 'button',
								children: ['icon:list', {textContent: i18n._('nodes')}],
								className: 'primary icon-left',
								'on:click': () => ROUTER.pushRoute(Routes.adventure_editor + '/' + row.id)
							}, null, td);
						}
					}]
				}
			}]
		}, this);

		this.adventures = await REST.GET('adventures/administration/list');
		this.table.setData(this.adventures);
	}
}

class AddImageCourseNode extends Dialog {
	beforeRender() {
		this.title = i18n._('Select a picture');
		this.allowCloseButton = true;
	}

	async renderBody() {
		this.images = await REST.GET('adventure-node-pictures/list');

		this.replaceChildren([{
			textContent: i18n._('Click on image for selecting it')
		},{
			className: 'images',
			ref: 'imagesEl',
			children: this.images.map(i => ({
				className: 'image',
				children: [{
					nodeName: 'img',
					src: `/api/adventures/node-picture/${i.id}`
				},{
					textContent: i.name
				}],
				'on:click': ({target}) => {
					const activeEl = this.imagesEl.querySelector('.active');
					activeEl?.classList.remove('active');
					target.closest('.image').classList.add('active');
					this.selectedImage = i;
				}
			}))
		},{
			nodeName: 'button',
			type: 'submit',
			className: 'primary save-button',
			textContent: i18n._('select'),
			'on:click': () => {
				this.fire('image', {
					id: this.selectedImage.id,
					name: this.selectedImage.name
				});
				this.close();
			}
		}], this, this.bodyEl);
	}
}

class AddImage extends ValidateChangesFormDialog {
	beforeRender() {
		this.data ??= {};
		this.submitText =  i18n._(this.data.id ? 'save' : 'add_picture');
		this.title =  i18n._(this.data.id ? 'edit_picture' : 'add_picture');
		this.allowCloseButton = true;
	}

	getFormFields() {
		return [{
			render: !!this.data?.id,
			children: [{
				nodeName: 'label',
				className: 'image-label',
				textContent: i18n._('paste_svg')
			},{
				className: 'image',
				nodeName: 'img',
				src: `/api/adventures/node-picture/${this.data?.id}`
			}]
		},{
			ref: 'fileInput',
			class: TextField,
			label: i18n._('picture'),
			type: 'file',
			required: false,
			'on:change': (obj, e) => {
				this.img = e.target.files;
			}
		},{
			class: TextField,
			name: 'name',
			label: i18n._('name'),
			value: this.data?.name,
			autofocus: !this.data?.group
		}]
	}

	async onSave(data) {
		if (!this.img && !this.data?.id) {
			NOTIFICATION.showStandardizedError(i18n._('non-upload_picture'));
			return;
		}

		if (this.img) {
			this.data = await Uploads.uploadFile(`/api/adventure-node-pictures${this.data.id ? '/' + this.data.id : ''}`, this.img);
		}

		const pic = await REST.PUT('adventure-node-pictures/' + this.data.id, data);
		this.fire('success', pic);
	}

	handleError(ex) {
		NOTIFICATION.showStandardizedError({
			'wrong_image_format': i18n._('wrong_image_format'),
		}[ex.code]);
	}
}

class ImageList extends Sword {
	render() {
		const me = this;

		this.el = this.createElement({
			children: [{
				className: 'header',
				children: [{
					nodeName: 'h3',
					textContent: i18n._('node_pictures')
				},{
					nodeName: 'button',
					children: ['icon:plus', i18n._('add_picture')],
					className: 'primary icon-left',
					'on:click': () => new AddImage(document.body, {
						'on:success': (obj, pic) => {
							me.images.push(pic);
							me.renderImages();
						}
					})
				}]
			},{
				className: 'images',
				ref: 'list'
			}]
		}, this);

		this.init();
	}

	async init() {
		this.images = await REST.GET('adventure-node-pictures/list');

		this.renderImages();
	}

	deleteImage(image) {
		const me = this;

		new ConfirmDialog(document.body, {
			title: i18n._('Are you sure you want to delete this image?'),
			confirmText: i18n._('yes'),
			cancelText: i18n._('no'),
			async onSave() {
				try {
					await REST.DELETE(`adventure-node-pictures/${image.id}`);
					me.images.deleteByIndex(im => im.id === image.id);
					me.renderImages();

					NOTIFICATION.showStandardizedSuccess(i18n._(`Image has been successfully deleted.`));
				} catch (ex) {
					NOTIFICATION.showStandardizedError({
						404: i18n._('Image not found')
					}[ex.status]);
				}
			}
		})
	}

	renderImages() {
		this.list.innerHTML = '';
		const me = this;

		for (const i of this.images) {
			this.append({
				className: 'image',
				children: [{
					nodeName: 'img',
					src: `/api/adventures/node-picture/${i.id}`
				},{
					textContent: i.name
				},{
					className: 'delete',
					nodeName: 'button',
					children: ['icon:bin'],
					title: i18n._('delete'),
					'on:click': async () => this.deleteImage(i)
				},{
					className: 'edit',
					nodeName: 'button',
					children: ['icon:pencil'],
					title: i18n._('edit'),
					'on:click': () => new AddImage(document.body, {
						data: i,
						'on:success': (obj, pic) => {
							me.images.updateByIndex(pic, p => p.id === i.id);
							me.renderImages();
						}
					})
				}]
			}, null, this.list);
		}
	}
}

class Administration extends SectionScreen {
	beforeRender() {
		this.defaultSection = Routes.administration_adventures;
	}

	getRoutes() {
		const routes = {
			languages: Routes.administration_languages,
			adventures: Routes.administration_adventures
		};

		if (DataManager.userIsAdmin()) {
			routes["users"] = Routes.administration_users;
			routes.images = Routes.administration_images;
		}

		return routes
	}

	getSidebarMenu() {
		return [{
			render: DataManager.userIsAtLeastEditor(),
			nodeName: 'a',
			className: 'item',
			children: [this.useIcon('book'), i18n._('adventures')],
			href: Routes.administration_adventures,
			screen: AdventuresSection
		},{
			render: DataManager.userIsAtLeastEditor(),
			nodeName: 'a',
			className: 'item',
			children: [this.useIcon('book'), i18n._('languages')],
			href: Routes.administration_languages,
			screen: LanguagesSection
		},{
			render: DataManager.userIsAdmin(),
			nodeName: 'a',
			className: 'item',
			children: [this.useIcon('users'), i18n._('users')],
			href: Routes.administration_users,
			screen: UsersSection
		},{
			render: DataManager.userIsAdmin(),
			nodeName: 'a',
			className: 'item',
			children: [this.useIcon('image'), i18n._('images')],
			href: Routes.administration_images,
			screen: ImageList
		}]
	}

	getHeader() {
		return {
			nodeName: 'nav',
			className: 'header',
			children: [{
				className: 'page-centered-container',
				children: [{
					class: AppLogo,
				},{
					className: 'tab-switcher',
					children: [{
						class: NavigationLink,
						text: i18n._('admin'),
						href: Routes.administration,
						activeOnRoutes: [Routes.administration_languages, Routes.administration_users, Routes.administration]
					}]
				}, {
					class: UserProfile
				}],
			}],
		}
	}
}
