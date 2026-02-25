import React from "react";
import Layout from "@/components/ui/Layout";
import { Helmet } from "react-helmet-async";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { emailManagementService } from "@/lib/services/emails/emailManagementService";
import { useToast } from "@/hooks/use-toast";

const schema = z.object({
  name: z.string().min(2, "نام را وارد کنید"),
  email: z.string().email("ایمیل معتبر نیست"),
  phone: z.string().optional(),
  message: z.string().min(10, "پیام حداقل ۱۰ کاراکتر باشد"),
  website: z.string().optional(), // honeypot
});

type FormValues = z.infer<typeof schema>;

const Contact: React.FC = () => {
  const { toast } = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    // Honeypot check
    if (values.website && values.website.trim().length > 0) {
      toast({ title: "پیام ارسال شد", description: "از تماس شما سپاسگزاریم." });
      reset();
      return;
    }

    try {
      const res = await emailManagementService.sendEmail({
        to: "info@arzansite.com",
        subject: `Contact Form: ${values.name}`,
        template: "contact",
        data: values,
      });
      if (res?.success) {
        toast({ title: "پیام شما ارسال شد", description: "به زودی با شما تماس می‌گیریم." });
        reset();
      } else {
        throw new Error("send failed");
      }
    } catch (e) {
      toast({ title: "خطا در ارسال", description: "لطفاً دوباره تلاش کنید یا با ایمیل تماس بگیرید.", });
    }
  };

  return (
    <Layout>
      <Helmet>
        <title>تماس با ما | ارزان‌سایت</title>
        <meta name="description" content="با تیم فروش و پشتیبانی ارزان‌سایت تماس بگیرید. مشاوره رایگان طراحی سایت، سئو و دیپلوی فوری." />
        <link rel="canonical" href="https://arzansite.com/contact" />
      </Helmet>

      <section className="relative pt-28 pb-16">
        <div className="max-w-5xl mx-auto px-4 md:px-8 grid md:grid-cols-2 gap-10 items-start">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold mb-4">در تماس باشید</h1>
            <p className="text-muted-foreground mb-6 leading-8">
              برای مشاوره رایگان طراحی و سئو، فرم زیر را پر کنید یا مستقیماً با ما تماس بگیرید.
            </p>
            <div className="space-y-2 text-sm">
              <p>ایمیل: <a className="text-primary" href="mailto:info@arzansite.com">info@arzansite.com</a></p>
              <p>تلفن: <a className="text-primary" href="tel:+982191030981">۰۲۱-۹۱۰۳-۰۹۸۱</a></p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-2xl p-6 shadow-md border">
            <input type="text" className="hidden" tabIndex={-1} autoComplete="off" {...register("website")} />
            <div className="grid gap-4">
              <div>
                <label className="text-sm font-medium">نام و نام خانوادگی</label>
                <Input placeholder="مثلاً سارا احمدی" {...register("name")} />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <label className="text-sm font-medium">ایمیل</label>
                <Input type="email" placeholder="you@example.com" {...register("email")} />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
              </div>
              <div>
                <label className="text-sm font-medium">شماره تماس (اختیاری)</label>
                <Input placeholder="0912…" {...register("phone")} />
              </div>
              <div>
                <label className="text-sm font-medium">پیام شما</label>
                <Textarea rows={6} placeholder="لطفاً توضیح دهید به چه چیزی نیاز دارید…" {...register("message")} />
                {errors.message && <p className="text-red-500 text-xs mt-1">{errors.message.message}</p>}
              </div>
              <Button type="submit" disabled={isSubmitting} className="px-6 py-3 text-base font-bold">
                {isSubmitting ? "در حال ارسال…" : "ارسال پیام"}
              </Button>
            </div>
          </form>
        </div>
      </section>
    </Layout>
  );
};

export default Contact;