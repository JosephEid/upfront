export const dbJobPostToUIJobPost = (x: any) => {
    return {
        companyLogo: "",
        companyName: x.company_name,
        companyWebsite: x.company_website,
        currency: x.currency,
        description: x.description,
        howToApply: x.how_to_apply,
        location: x.location,
        maxSalary: x.max_salary,
        minSalary: x.min_salary,
        title: x.title,
        visaSponsorship: x.visa_sponsorship,
        yourEmail: x.login_email,
    };
};
