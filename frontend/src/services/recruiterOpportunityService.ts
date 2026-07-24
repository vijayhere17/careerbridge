import api from "@/lib/auth";

export const recruiterOpportunityService = {

  getAll() {
    return api.get("/recruiter/opportunities");
  },

  get(id: number) {
    return api.get(`/recruiter/opportunities/${id}`);
  },

  publish(data: any) {
    return api.post("/recruiter/opportunities", data);
  },

  saveDraft(data: any) {
    return api.post("/recruiter/opportunities/save-draft", data);
  },

  update(id: number, data: any) {
    return api.put(`/recruiter/opportunities/${id}`, data);
  },

  delete(id: number) {
    return api.delete(`/recruiter/opportunities/${id}`);
  }

};