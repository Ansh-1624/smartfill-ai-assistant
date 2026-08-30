/**
 * SmartFill AI Assistant — Smart Field Identification & Fuzzy Matcher (fieldMatcher.js)
 * Robust matching for Google Forms, Typeform, Microsoft Forms, Workday, SPAs & standard HTML forms.
 */

var FieldMatcher = globalThis.FieldMatcher || (function () {
  const matcher = {
    DICTIONARY: {
      fullName: [
        'fullname', 'full_name', 'name', 'yourname', 'applicantname', 'candidatename',
        'candidate_name', 'user_name', 'username', 'billing_name', 'cardholder_name',
        'contact_name', 'client_name', 'studentname', 'student_name', 'personname', 'entername'
      ],
      firstName: ['firstname', 'first_name', 'fname', 'first', 'given_name', 'givenname', 'forename'],
      lastName: ['lastname', 'last_name', 'lname', 'last', 'surname', 'family_name', 'familyname'],
      email: [
        'email', 'e-mail', 'mail', 'emailaddress', 'email_address', 'user_email',
        'contact_email', 'work_email', 'personal_email', 'enteremail', 'emailid'
      ],
      phone: [
        'phone', 'phonenumber', 'phone_number', 'telephone', 'tel', 'mobile',
        'cell', 'cellphone', 'contactnumber', 'contact_number', 'contactno', 'mobile_no',
        'phone_no', 'whatsapp', 'mobilenumber', 'mobile_number', 'contact'
      ],
      dob: ['dob', 'dateofbirth', 'date_of_birth', 'birthdate', 'birth_date', 'birthday', 'bday', 'birth'],
      gender: ['gender', 'sex'],

      streetAddress: [
        'address', 'street', 'streetaddress', 'street_address', 'address1',
        'address_line_1', 'addr1', 'billing_address', 'shipping_address', 'residential_address',
        'permanent_address', 'current_address', 'line1', 'house', 'flat'
      ],
      addressLine2: ['address2', 'address_line_2', 'addr2', 'apartment', 'suite', 'unit', 'building', 'floor', 'line2'],
      city: ['city', 'town', 'municipality', 'locality', 'district'],
      state: ['state', 'province', 'region', 'county', 'territory', 'administrative_area'],
      zipCode: ['zip', 'zipcode', 'zip_code', 'postal', 'postalcode', 'postal_code', 'pincode', 'pin_code', 'post_code', 'pin'],
      country: ['country', 'nation', 'country_name', 'country_code'],

      jobTitle: ['jobtitle', 'job_title', 'title', 'position', 'role', 'designation', 'occupation', 'profession', 'currentrole'],
      company: ['company', 'organization', 'employer', 'workplace', 'firm', 'agency', 'business', 'college', 'university', 'institution', 'school'],
      linkedin: ['linkedin', 'linkedin_url', 'linkedin_profile', 'linkedin_link', 'linkedinprofile'],
      github: ['github', 'github_url', 'github_profile', 'portfolio', 'website', 'personal_website', 'homepage', 'repo', 'githublink'],
      bio: ['bio', 'about', 'about_me', 'summary', 'profile_summary', 'coverletter', 'cover_letter', 'description', 'objective', 'remarks'],
      skills: ['skills', 'technologies', 'expertise', 'specialization', 'techstack'],

      aadhaar: ['aadhaar', 'aadhar', 'uidai', 'unique_id', 'aadhar_number', 'aadhaar_no', 'aadharno'],
      pan: ['pan', 'pan_card', 'pancard', 'pan_number', 'pan_no', 'panno', 'tax_id', 'taxid'],
      passport: ['passport', 'passport_number', 'passport_no', 'pass_no', 'travel_doc', 'passportno'],
      drivingLicense: ['driving_license', 'driver_license', 'dl', 'dl_number', 'license_no', 'driver_id', 'licenseno'],
      ssn: ['ssn', 'social_security', 'social_security_number', 'national_id', 'id_number', 'gov_id', 'rollno', 'registrationno']
    },

    normalize(str) {
      if (!str || typeof str !== 'string') return '';
      return str.toLowerCase().replace(/[^a-z0-9]/g, '');
    },

    extractDescriptors(el) {
      const descriptors = [];

      if (el.getAttribute('autocomplete')) descriptors.push(this.normalize(el.getAttribute('autocomplete')));
      if (el.name) descriptors.push(this.normalize(el.name));
      if (el.id) descriptors.push(this.normalize(el.id));
      if (el.placeholder) descriptors.push(this.normalize(el.placeholder));
      if (el.title) descriptors.push(this.normalize(el.title));

      if (el.getAttribute('aria-label')) {
        descriptors.push(this.normalize(el.getAttribute('aria-label')));
      }
      if (el.getAttribute('aria-labelledby')) {
        const ids = el.getAttribute('aria-labelledby').trim().split(/\s+/);
        for (const id of ids) {
          const refEl = document.getElementById(id);
          if (refEl && refEl.textContent) {
            descriptors.push(this.normalize(refEl.textContent));
          }
        }
      }
      if (el.getAttribute('aria-describedby')) {
        const ids = el.getAttribute('aria-describedby').trim().split(/\s+/);
        for (const id of ids) {
          const refEl = document.getElementById(id);
          if (refEl && refEl.textContent) {
            descriptors.push(this.normalize(refEl.textContent));
          }
        }
      }

      if (el.labels && el.labels.length > 0) {
        for (const label of el.labels) {
          descriptors.push(this.normalize(label.textContent));
        }
      } else if (el.id) {
        const label = document.querySelector(`label[for="${el.id}"]`);
        if (label && label.textContent) {
          descriptors.push(this.normalize(label.textContent));
        }
      }

      const questionCard = el.closest('[role="listitem"], .Qr7Oae, .geS5n, .freebirdFormviewerViewNumberedItemContainer, .form-group, .form-field, .input-container, fieldset, tr, [jsmodel]');
      if (questionCard) {
        const titleEls = questionCard.querySelectorAll('[role="heading"], .M7eMe, .HoGqVe, .freebirdFormviewerViewItemsItemItemTitle, legend, label, h1, h2, h3, h4, h5, h6, .title, [jsname="r4nke"]');
        for (const t of titleEls) {
          if (t.textContent && t.textContent.length < 150) {
            descriptors.push(this.normalize(t.textContent));
          }
        }
      } else {
        let p = el.parentElement;
        for (let i = 0; i < 5 && p; i++) {
          const h = p.querySelector('[role="heading"], .M7eMe, .HoGqVe, label, legend, h2, h3, h4');
          if (h && h.textContent && h.textContent.length < 150) {
            descriptors.push(this.normalize(h.textContent));
            break;
          }
          p = p.parentElement;
        }
      }

      const filtered = descriptors.filter(d => d && d !== 'youranswer');
      return filtered.length > 0 ? [...new Set(filtered)] : [...new Set(descriptors.filter(Boolean))];
    },

    matchField(el, userData) {
      if (!el || !userData) return null;
      const descriptors = this.extractDescriptors(el);
      if (!descriptors.length) return null;

      const inputType = (el.type || '').toLowerCase();

      if (inputType === 'email') {
        const val = this.resolveStoredValue('email', userData);
        if (val) return { key: 'email', value: val, category: 'personal' };
      }
      if (inputType === 'tel') {
        const val = this.resolveStoredValue('phone', userData);
        if (val) return { key: 'phone', value: val, category: 'personal' };
      }

      if (Array.isArray(userData.customFields)) {
        for (const custom of userData.customFields) {
          if (!custom.key || !custom.value) continue;
          const normKey = this.normalize(custom.key);
          for (const desc of descriptors) {
            if (desc.includes(normKey) || normKey.includes(desc)) {
              return { key: custom.key, value: custom.value, category: 'custom' };
            }
          }
        }
      }

      for (const desc of descriptors) {
        // Email
        if (desc.includes('email') || desc.includes('mailaddress')) {
          const val = this.resolveStoredValue('email', userData);
          if (val) return { key: 'email', value: val, category: 'personal' };
        }

        // Phone
        if (desc.includes('contactnumber') || desc.includes('phonenumber') || desc.includes('phoneno') || desc.includes('contactno') || desc.includes('mobile') || desc.includes('telephone') || desc.includes('phone') || desc.includes('whatsapp') || desc.includes('contact')) {
          if (!desc.includes('email') && !desc.includes('name')) {
            const val = this.resolveStoredValue('phone', userData);
            if (val) return { key: 'phone', value: val, category: 'personal' };
          }
        }

        // Full Name (Primary Priority)
        if (desc === 'fullname' || desc.includes('fullname') || desc === 'name' || desc === 'yourname' || desc.includes('applicantname') || desc.includes('candidatename') || desc.includes('studentname') || desc.includes('personname')) {
          if (!desc.includes('company') && !desc.includes('college') && !desc.includes('file') && !desc.includes('org')) {
            const val = this.resolveStoredValue('fullName', userData);
            if (val) return { key: 'fullName', value: val, category: 'personal' };
          }
        }

        // First Name
        if (desc === 'firstname' || desc.includes('firstname') || desc === 'fname' || desc.startsWith('fname') || desc.includes('givenname') || desc.includes('forename')) {
          const val = this.resolveStoredValue('firstName', userData);
          if (val) return { key: 'firstName', value: val, category: 'personal' };
        }

        // Last Name
        if (desc === 'lastname' || desc.includes('lastname') || desc === 'lname' || desc.startsWith('lname') || desc.includes('surname') || desc.includes('familyname')) {
          if (!desc.includes('fullname')) {
            const val = this.resolveStoredValue('lastName', userData);
            if (val) return { key: 'lastName', value: val, category: 'personal' };
          }
        }

        // Company
        if (desc.includes('company') || desc.includes('organization') || desc.includes('employer') || desc.includes('college') || desc.includes('university') || desc.includes('institution') || desc.includes('workplace')) {
          const val = this.resolveStoredValue('company', userData);
          if (val) return { key: 'company', value: val, category: 'professional' };
        }

        // Job Title
        if (desc.includes('jobtitle') || desc.includes('designation') || desc.includes('position') || desc.includes('role') || desc.includes('occupation')) {
          const val = this.resolveStoredValue('jobTitle', userData);
          if (val) return { key: 'jobTitle', value: val, category: 'professional' };
        }

        // LinkedIn
        if (desc.includes('linkedin')) {
          const val = this.resolveStoredValue('linkedin', userData);
          if (val) return { key: 'linkedin', value: val, category: 'professional' };
        }

        // GitHub
        if (desc.includes('github') || desc.includes('portfolio') || desc.includes('website')) {
          const val = this.resolveStoredValue('github', userData);
          if (val) return { key: 'github', value: val, category: 'professional' };
        }

        // Address Fields
        if (desc.includes('flatno') || desc.includes('houseno') || desc.includes('flatnum') || desc.includes('housenum') || desc.includes('buildingno') || desc.includes('roomno') || desc.includes('unitno') || desc.includes('doorno') || desc.includes('flat') || desc.includes('house')) {
          const val = this.resolveStoredValue('flatNo', userData);
          if (val) return { key: 'flatNo', value: val, category: 'address' };
        }
        if (desc.includes('fulladdress') || desc.includes('residentialaddress') || desc.includes('permanentaddress') || desc.includes('completeaddress') || desc.includes('mailingaddress') || (desc.includes('address') && !desc.includes('email') && !desc.includes('street') && !desc.includes('city') && !desc.includes('state') && !desc.includes('zip') && !desc.includes('pin'))) {
          const val = this.resolveStoredValue('fullAddress', userData);
          if (val) return { key: 'fullAddress', value: val, category: 'address' };
        }
        if (desc.includes('streetaddress') || desc.includes('addressline1') || desc.includes('locality') || desc.includes('landmark') || desc.includes('street') || desc.includes('area') || desc.includes('road')) {
          const val = this.resolveStoredValue('streetAddress', userData);
          if (val) return { key: 'streetAddress', value: val, category: 'address' };
        }
        if (desc.includes('city') || desc.includes('town') || desc.includes('district') || desc.includes('municipality')) {
          const val = this.resolveStoredValue('city', userData);
          if (val) return { key: 'city', value: val, category: 'address' };
        }
        if (desc.includes('state') || desc.includes('province') || desc.includes('region') || desc.includes('territory')) {
          const val = this.resolveStoredValue('state', userData);
          if (val) return { key: 'state', value: val, category: 'address' };
        }
        if (desc.includes('pincode') || desc.includes('postalcode') || desc.includes('zipcode') || desc.includes('zip') || desc.includes('postal') || desc.includes('pin')) {
          const val = this.resolveStoredValue('zipCode', userData);
          if (val) return { key: 'zipCode', value: val, category: 'address' };
        }
        if (desc.includes('country') || desc.includes('nation')) {
          const val = this.resolveStoredValue('country', userData);
          if (val) return { key: 'country', value: val, category: 'address' };
        }
      }

      for (const [fieldKey, synonyms] of Object.entries(this.DICTIONARY)) {
        for (const desc of descriptors) {
          const matched = synonyms.some(syn => desc === syn || (syn.length > 4 && desc.includes(syn)));
          if (matched) {
            const val = this.resolveStoredValue(fieldKey, userData);
            if (val) {
              return { key: fieldKey, value: val, category: this.getCategoryForField(fieldKey) };
            }
          }
        }
      }

      if (Array.isArray(userData.documents)) {
        for (const doc of userData.documents) {
          if (!doc.name || !doc.number) continue;
          const normDocName = this.normalize(doc.name);
          for (const desc of descriptors) {
            if (desc.includes(normDocName) || normDocName.includes(desc)) {
              return { key: doc.name, value: doc.number, category: 'document' };
            }
          }
        }
      }

      return null;
    },

    resolveStoredValue(fieldKey, data) {
      if (!data) return null;
      if (data.personal && data.personal[fieldKey]) return data.personal[fieldKey];
      if (data.address && data.address[fieldKey]) return data.address[fieldKey];
      if (data.professional && data.professional[fieldKey]) return data.professional[fieldKey];

      if (fieldKey === 'fullAddress') {
        if (data.address?.fullAddress) return data.address.fullAddress;
        if (data.address) {
          const parts = [
            data.address.flatNo,
            data.address.streetAddress,
            data.address.city,
            data.address.state,
            data.address.zipCode,
            data.address.country
          ].filter(Boolean);
          if (parts.length > 0) return parts.join(', ');
        }
      }

      if (fieldKey === 'fullName') {
        if (data.personal?.fullName) return data.personal.fullName;
        if (data.personal?.firstName && data.personal?.lastName) {
          return `${data.personal.firstName} ${data.personal.lastName}`.trim();
        }
      }
      if (fieldKey === 'firstName') {
        if (data.personal?.firstName) return data.personal.firstName;
        if (data.personal?.fullName) return data.personal.fullName.split(' ')[0] || '';
      }
      if (fieldKey === 'lastName') {
        if (data.personal?.lastName) return data.personal.lastName;
        if (data.personal?.fullName) {
          const parts = data.personal.fullName.split(' ');
          return parts.length > 1 ? parts.slice(1).join(' ') : '';
        }
      }

      if (Array.isArray(data.documents)) {
        const found = data.documents.find(d => this.normalize(d.name) === this.normalize(fieldKey) || this.normalize(d.type) === this.normalize(fieldKey));
        if (found && found.number) return found.number;
      }

      return null;
    },

    getCategoryForField(fieldKey) {
      if (['fullName', 'firstName', 'lastName', 'email', 'phone', 'dob', 'gender'].includes(fieldKey)) return 'personal';
      if (['streetAddress', 'addressLine2', 'city', 'state', 'zipCode', 'country'].includes(fieldKey)) return 'address';
      if (['jobTitle', 'company', 'linkedin', 'github', 'bio', 'skills'].includes(fieldKey)) return 'professional';
      return 'custom';
    }
  };

  return matcher;
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = FieldMatcher;
} else {
  globalThis.FieldMatcher = FieldMatcher;
}
